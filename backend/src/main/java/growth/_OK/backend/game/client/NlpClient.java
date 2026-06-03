package growth._OK.backend.game.client;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import growth._OK.backend.game.domain.ProblemType;
import growth._OK.backend.game.service.GeminiService;
import growth._OK.backend.global.config.NlpProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class NlpClient {

    private final NlpProperties nlpProperties;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    public record NlpGenerateRequest(
            @JsonProperty("source_text")    String sourceText,
            @JsonProperty("grammar_tags")   List<String> grammarTags,
            @JsonProperty("problem_count")  int problemCount,
            @JsonProperty("problem_types")  List<String> problemTypes,
            @JsonProperty("personalization_context") String personalizationContext
    ) {}

    public record NlpProblem(
            String question,
            List<String> options,
            @JsonProperty("correct_answer")      String correctAnswer,
            @JsonProperty("sentence_with_blank") String sentenceWithBlank,
            String explanation,   // ← FastAPI의 해설 필드 추가
            String type,
            String scope
    ) {}

    public record NlpGenerateResponse(
            List<NlpProblem> problems,
            @JsonProperty("source_sentences")  List<String> sourceSentences,
            @JsonProperty("grammar_tags_used") List<String> grammarTagsUsed
    ) {}

    public List<GeminiService.RawGeneratedProblem> generateProblems(
            String sourceText,
            List<String> grammarTags,
            int problemCount,
            List<ProblemType> problemTypes,
            String personalizationContext
    ) {
        if (!nlpProperties.isEnabled()) {
            log.info("[NlpClient] nlp.enabled=false, skipping NLP server call");
            return null;
        }

        List<String> typeNames = problemTypes == null || problemTypes.isEmpty()
                ? List.of("MULTIPLE_CHOICE", "OX", "SHORT_ANSWER")
                : problemTypes.stream().map(Enum::name).toList();

        NlpGenerateRequest requestBody = new NlpGenerateRequest(
                sourceText,
                grammarTags,
                problemCount,
                typeNames,
                personalizationContext
        );

        try {
            NlpGenerateResponse response = webClientBuilder.build()
                    .post()
                    .uri(nlpProperties.getServerUrl() + "/api/generate/problems")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(NlpGenerateResponse.class)
                    .block(Duration.ofSeconds(nlpProperties.getTimeoutSeconds()));

            if (response == null || response.problems() == null || response.problems().isEmpty()) {
                log.warn("[NlpClient] Empty response from NLP server");
                return null;
            }

            log.info("[NlpClient] Received {} problems from NLP server (tags: {})",
                    response.problems().size(),
                    response.grammarTagsUsed());

            return response.problems().stream()
                    .map(this::toRaw)
                    .toList();

        } catch (Exception e) {
            log.warn("[NlpClient] NLP server call failed ({}): {} — falling back to Gemini",
                    nlpProperties.getServerUrl(), e.getMessage());
            return null;
        }
    }

    private GeminiService.RawGeneratedProblem toRaw(NlpProblem p) {
        GeminiService.RawGeneratedProblem raw = new GeminiService.RawGeneratedProblem();
        raw.question      = p.question();
        raw.options       = p.options() != null ? p.options() : List.of();
        raw.correctAnswer = p.correctAnswer();
        raw.type          = p.type();
        raw.scope         = p.scope();
        raw.explanation   = p.explanation();   // ← FastAPI 해설 매핑
        return raw;
    }

    public boolean isHealthy() {
        if (!nlpProperties.isEnabled()) return false;
        try {
            Map<?, ?> resp = webClientBuilder.build()
                    .get()
                    .uri(nlpProperties.getServerUrl() + "/health")
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block(Duration.ofSeconds(5));
            return resp != null && "ok".equals(resp.get("status"));
        } catch (Exception e) {
            log.debug("[NlpClient] Health check failed: {}", e.getMessage());
            return false;
        }
    }
}