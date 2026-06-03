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

/**
 * FastAPI NLP 서버 클라이언트
 * POST /api/generate/problems → GeminiService.RawGeneratedProblem 리스트로 변환
 *
 * nlp.enabled=false 이거나 서버 응답 실패 시 null 반환 → GameGenerateService에서 Gemini fallback
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NlpClient {

    private final NlpProperties nlpProperties;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    // ── FastAPI 요청 body ──────────────────────────────────────────────────────

    public record NlpGenerateRequest(
            @JsonProperty("source_text")    String sourceText,
            @JsonProperty("grammar_tags")   List<String> grammarTags,
            @JsonProperty("problem_count")  int problemCount,
            @JsonProperty("problem_types")  List<String> problemTypes,
            @JsonProperty("personalization_context") String personalizationContext
    ) {}

    // ── FastAPI 응답 body ─────────────────────────────────────────────────────

    public record NlpProblem(
            String question,
            List<String> options,
            @JsonProperty("correct_answer") String correctAnswer,
            String type,
            String scope
    ) {}

    public record NlpGenerateResponse(
            List<NlpProblem> problems,
            @JsonProperty("source_sentences") List<String> sourceSentences,
            @JsonProperty("grammar_tags_used") List<String> grammarTagsUsed
    ) {}

    // ── 핵심 메서드 ────────────────────────────────────────────────────────────

    /**
     * FastAPI 서버에 문제 생성 요청.
     *
     * @param sourceText             사용자 업로드 텍스트 (null 가능 — corpus에서 자동 검색)
     * @param grammarTags            취약점 기반 grammar tag 목록 (null 가능)
     * @param problemCount           생성할 문제 수
     * @param problemTypes           문제 유형 목록
     * @param personalizationContext AnalysisService에서 만든 사용자 취약점 JSON 문자열
     * @return 파싱된 문제 목록. 실패 시 null 반환 → 호출부에서 Gemini fallback 처리
     */
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

    /**
     * FastAPI 응답 → GeminiService.RawGeneratedProblem 변환
     * 기존 GameGenerateService 로직을 그대로 재사용할 수 있게 맞춤
     */
    private GeminiService.RawGeneratedProblem toRaw(NlpProblem p) {
        GeminiService.RawGeneratedProblem raw = new GeminiService.RawGeneratedProblem();
        raw.question      = p.question();
        raw.options       = p.options() != null ? p.options() : List.of();
        raw.correctAnswer = p.correctAnswer();
        raw.type          = p.type();
        raw.scope         = p.scope();
        return raw;
    }

    // ── 헬스체크 ───────────────────────────────────────────────────────────────

    /**
     * NLP 서버 상태 확인 (로컬 테스트용)
     */
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
