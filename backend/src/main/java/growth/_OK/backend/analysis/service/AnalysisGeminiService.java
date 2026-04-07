package growth._OK.backend.analysis.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import growth._OK.backend.game.client.GeminiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisGeminiService {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    public AnalysisAiResult analyzeWrongProblems(List<AnalysisService.WrongSeed> seeds) {
        if (seeds == null || seeds.isEmpty()) {
            return new AnalysisAiResult(Map.of(), List.of());
        }

        StringBuilder input = new StringBuilder();
        for (AnalysisService.WrongSeed seed : seeds) {
            input.append("- problemId: ").append(seed.problemId()).append("\n")
                    .append("  categoryHint: ").append(seed.category()).append("\n")
                    .append("  question: ").append(seed.question()).append("\n")
                    .append("  answer: ").append(seed.answer()).append("\n");
        }

        String prompt = """
                너는 학습 분석 도우미다.
                아래 오답 문제 목록을 보고 각 문제의 scope(개념/학습범위)를 짧은 한국어로 분류해라.
                category는 반드시 WORD 또는 GRAMMAR만 사용해라.
                weakTop3은 전체 문제 기준으로 가장 취약한 scope 3개를 넣어라.
                
                반드시 아래 JSON 형식만 출력해라:
                {
                  "items":[
                    {"problemId":1,"category":"WORD","scope":"동의어"},
                    {"problemId":2,"category":"GRAMMAR","scope":"조건문"}
                  ],
                  "weakTop3":["...", "...", "..."]
                }
                
                문제 목록:
                %s
                """.formatted(input);

        try {
            String raw = geminiClient.generateText(prompt);
            String json = extractJsonBlock(raw);
            JsonNode root = objectMapper.readTree(json);

            Map<Long, ScopeCategory> perProblem = new HashMap<>();
            List<String> top3 = new ArrayList<>();

            JsonNode items = root.path("items");
            if (items.isArray()) {
                for (JsonNode node : items) {
                    long id = node.path("problemId").asLong(-1L);
                    if (id < 0) continue;
                    String category = normalizeCategory(node.path("category").asText(""));
                    String scope = node.path("scope").asText("").trim();
                    if (scope.isBlank()) {
                        scope = "기타";
                    }
                    perProblem.put(id, new ScopeCategory(category, scope));
                }
            }

            JsonNode weakTop3 = root.path("weakTop3");
            if (weakTop3.isArray()) {
                for (JsonNode node : weakTop3) {
                    String v = node.asText("").trim();
                    if (!v.isBlank()) top3.add(v);
                    if (top3.size() == 3) break;
                }
            }
            return new AnalysisAiResult(perProblem, top3);
        } catch (Exception e) {
            log.warn("Failed to analyze wrong problems via Gemini", e);
            return new AnalysisAiResult(Map.of(), List.of());
        }
    }

    public String generateReviewDescription(String category, String scope) {
        String prompt = """
                다음 학습 범위 복습 게임 소개 문구를 한국어로 2문장 이내로 만들어라.
                category: %s
                scope: %s
                
                조건:
                - 초등/중등 학습자 톤으로 쉽고 명확하게
                - JSON 없이 평문만
                """.formatted(category, scope);

        try {
            String text = geminiClient.generateText(prompt);
            if (text == null || text.isBlank()) {
                return scope + " 개념 복습을 위한 맞춤 게임입니다.";
            }
            return text.trim();
        } catch (Exception e) {
            return scope + " 개념 복습을 위한 맞춤 게임입니다.";
        }
    }

    private static String normalizeCategory(String raw) {
        if ("GRAMMAR".equalsIgnoreCase(raw)) {
            return "GRAMMAR";
        }
        return "WORD";
    }

    private static String extractJsonBlock(String raw) {
        if (raw == null) return "{}";
        String s = raw.trim();
        int objStart = s.indexOf('{');
        if (objStart < 0) {
            return "{}";
        }
        int depth = 0;
        int end = -1;
        for (int i = objStart; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '{') depth++;
            if (c == '}') depth--;
            if (depth == 0) {
                end = i;
                break;
            }
        }
        return end > objStart ? s.substring(objStart, end + 1) : "{}";
    }

    public record ScopeCategory(String category, String scope) {}

    public record AnalysisAiResult(Map<Long, ScopeCategory> perProblem, List<String> weakTop3) {}
}
