package growth._OK.backend.game.controller;

import growth._OK.backend.game.client.NlpClient;
import growth._OK.backend.global.config.NlpProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 로컬 테스트용 — NLP 서버 연결 상태 확인
 * GET /nlp/status
 */
@RestController
@RequestMapping("/nlp")
@RequiredArgsConstructor
public class NlpStatusController {

    private final NlpClient nlpClient;
    private final NlpProperties nlpProperties;

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        boolean healthy = nlpClient.isHealthy();
        return ResponseEntity.ok(Map.of(
                "nlpEnabled",   nlpProperties.isEnabled(),
                "serverUrl",    nlpProperties.getServerUrl(),
                "nlpHealthy",   healthy,
                "mode",         healthy ? "RAG (NLP Server)" : "Fallback (Gemini Direct)"
        ));
    }
}

