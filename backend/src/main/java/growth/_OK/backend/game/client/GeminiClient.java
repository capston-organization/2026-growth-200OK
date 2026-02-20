package growth._OK.backend.game.client;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import growth._OK.backend.global.config.GeminiProperties;
import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.net.URI;
import java.util.List;
import java.util.Map;

/**
 * Gemini generateContent REST API 호출.
 * POST {baseUrl}/{model}:generateContent?key={apiKey}
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiClient {

    private final GeminiProperties geminiProperties;
    private final WebClient.Builder webClientBuilder;
    private final ObjectMapper objectMapper;

    private static final String API_KEY_HEADER = "x-goog-api-key";
    private static final int REQUEST_TIMEOUT_SECONDS = 60;

    /**
     * 프롬프트 한 개로 텍스트 생성. 429 시 GEMINI_QUOTA_EXCEEDED 예외.
     * API 키는 x-goog-api-key 헤더로 전달 (Google 권장).
     */
    public String generateText(String prompt) {
        if (prompt == null || prompt.isBlank()) {
            return "";
        }
        String apiKey = geminiProperties.getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("GEMINI_API_KEY is not set");
            throw new CapstonException(ExceptionCode.INTERNAL_SERVER_ERROR);
        }
        String url = geminiProperties.getGenerateContentUrl() + "/" + geminiProperties.getModel() + ":generateContent";
        Map<String, Object> body = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", prompt)))),
                "generationConfig", Map.of(
                        "temperature", 0.7,
                        "maxOutputTokens", 8192
                )
        );
        try {
            String response = webClientBuilder.build()
                    .post()
                    .uri(URI.create(url))
                    .header(API_KEY_HEADER, apiKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .onStatus(HttpStatusCode::is4xxClientError, res -> res.bodyToMono(String.class)
                            .flatMap(bodyStr -> {
                                log.warn("Gemini API 4xx: {} body={}", res.statusCode(), bodyStr);
                                if (res.statusCode().value() == 429) {
                                    return Mono.error(new CapstonException(ExceptionCode.GEMINI_QUOTA_EXCEEDED));
                                }
                                return Mono.error(new WebClientResponseException(res.statusCode().value(), res.statusCode().toString(), res.headers().asHttpHeaders(), bodyStr.getBytes(), null));
                            }))
                    .bodyToMono(String.class)
                    .block(java.time.Duration.ofSeconds(REQUEST_TIMEOUT_SECONDS));
            return extractTextFromResponse(response);
        } catch (CapstonException e) {
            throw e;
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 429) {
                throw new CapstonException(ExceptionCode.GEMINI_QUOTA_EXCEEDED);
            }
            log.warn("Gemini API error: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new CapstonException(ExceptionCode.INTERNAL_SERVER_ERROR);
        } catch (Exception e) {
            log.warn("Gemini request failed: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
            throw new CapstonException(ExceptionCode.INTERNAL_SERVER_ERROR);
        }
    }

    private String extractTextFromResponse(String responseJson) {
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode candidates = root.path("candidates");
            if (candidates.isEmpty()) {
                return "";
            }
            JsonNode content = candidates.get(0).path("content").path("parts");
            if (content.isEmpty()) {
                return "";
            }
            return content.get(0).path("text").asText("");
        } catch (Exception e) {
            log.warn("Failed to parse Gemini response", e);
            return "";
        }
    }
}
