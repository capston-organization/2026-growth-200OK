package growth._OK.backend.game.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import growth._OK.backend.game.client.GeminiClient;
import growth._OK.backend.game.domain.ProblemType;
import growth._OK.backend.game.dto.ResponseDto.GamePreviewResponseDto;
import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GeminiService {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;

    private static final int SOURCE_TEXT_MAX_LENGTH = 20_000;
    private static final int MAX_QUESTION_LENGTH = 80;
    private static final int MAX_OPTION_LENGTH = 50;
    private static final int MAX_SHORT_ANSWER_LENGTH = 50;

    public GamePreviewResponseDto generatePreviewFromSource(String description, String sourceText) {
        if (sourceText == null || sourceText.isBlank()) {
            throw new CapstonException(ExceptionCode.SOURCE_CONTENT_EMPTY);
        }
        String truncated = sourceText.length() > SOURCE_TEXT_MAX_LENGTH
                ? sourceText.substring(0, SOURCE_TEXT_MAX_LENGTH) + "..."
                : sourceText;
        String prompt = """
                당신은 게임 시작 전에 학습자가 미리 공부할 "학습 자료"를 만드는 역할을 합니다.
                아래 소스 텍스트는 곧 퀴즈/문제로 나올 내용입니다. 학습자가 게임을 시작하기 전에 이 내용을 읽고 학습 목표와 배울 내용을 파악할 수 있도록 정리해 주세요.
                
                요구사항:
                1) learningObjectives: 이 게임에서 풀 문제들을 통해 달성할 학습 목표를 1~3문장으로 작성 (예: "주어와 동사 일치 규칙을 이해한다.")
                2) learningContent: 게임에서 나올 문제들의 핵심 개념·배울 내용을 학습자가 미리 공부할 수 있도록 5~10문장 정도로 구성 (개념 설명, 예시 포함)
                
                반드시 아래 JSON 형식으로만 출력하고, 코드 블록이나 다른 말은 붙이지 마세요.
                {"learningObjectives":"...","learningContent":"..."}
                
                소스 텍스트:
                %s
                """.formatted(truncated);
        String raw = geminiClient.generateText(prompt);
        return parsePreviewResponse(description, raw);
    }

    private GamePreviewResponseDto parsePreviewResponse(String description, String raw) {
        if (raw == null || raw.isBlank()) {
            return GamePreviewResponseDto.builder()
                    .description(description != null ? description : "")
                    .learningObjectives("")
                    .learningContent("")
                    .build();
        }
        try {
            String json = extractJsonBlock(raw);
            JsonNode node = objectMapper.readTree(json);
            String objectives = node.path("learningObjectives").asText("");
            String content = node.path("learningContent").asText("");
            return GamePreviewResponseDto.builder()
                    .description(description != null ? description : "")
                    .learningObjectives(objectives)
                    .learningContent(content)
                    .build();
        } catch (Exception e) {
            log.warn("Failed to parse preview JSON, using raw text as learningContent", e);
            return GamePreviewResponseDto.builder()
                    .description(description != null ? description : "")
                    .learningObjectives("")
                    .learningContent(raw)
                    .build();
        }
    }

    public List<RawGeneratedProblem> generateProblemsFromSource(String sourceText, int count, List<ProblemType> types) {
        if (sourceText == null || sourceText.isBlank()) {
            throw new CapstonException(ExceptionCode.SOURCE_CONTENT_EMPTY);
        }
        String truncated = sourceText.length() > SOURCE_TEXT_MAX_LENGTH
                ? sourceText.substring(0, SOURCE_TEXT_MAX_LENGTH) + "..."
                : sourceText;
        List<String> typeNames = types.isEmpty()
                ? List.of("MULTIPLE_CHOICE", "OX", "SHORT_ANSWER")
                : types.stream().map(Enum::name).collect(Collectors.toList());
        String typeStr = String.join(", ", typeNames);
        String prompt = """
                아래 소스 텍스트를 바탕으로 정확히 %d개의 퀴즈 문제를 만들어 주세요.
                
                [문제 유형] (반드시 아래만 사용)
                - SHORT_ANSWER: 단답형. 질문 80자 이내, 정답은 50자 이내(한 단어·숫자·짧은 구절).
                - OX: O/X. 질문 80자 이내, 정답은 "O" 또는 "X"만.
                - MULTIPLE_CHOICE: 5지선다. 반드시 선택지를 정확히 5개만 만드세요. 4개나 6개 이상 금지.
                
                [글자 수 제한 - UI 표시를 위해 꼭 지켜주세요]
                - question: 단답형/객관식/OX 모두 80자 이내로 짧고 명확하게.
                - MULTIPLE_CHOICE의 options: 각 선택지 50자 이내, 반드시 5개만. 기호(①②) 없이 내용만.
                - SHORT_ANSWER의 correctAnswer: 50자 이내.
                
                사용할 유형: %s (여러 유형이면 골고루 섞기)
                
                [필드 규칙]
                - question: 문제 지문 (한국어, 80자 이내)
                - options: SHORT_ANSWER/OX면 빈 배열 []. MULTIPLE_CHOICE면 반드시 길이 5인 배열 (5지선다만 허용).
                - correctAnswer: 정답. OX면 "O" 또는 "X", 단답형이면 50자 이내, 객관식이면 5개 중 정답 선택지 문자열.
                - type: SHORT_ANSWER, OX, MULTIPLE_CHOICE 중 하나
                - scope: 학습 범위(예: 관계대명사, 조건문, 동의어) 2~12자
                
                JSON 배열만 출력하고 설명 금지. 선택지에 ①② 기호 붙이지 마세요.
                
                소스 텍스트:
                %s
                """.formatted(count, typeStr, truncated);
        String raw = geminiClient.generateText(prompt);
        return parseProblemsResponse(raw);
    }

    public static class RawGeneratedProblem {
        public String question;
        public List<String> options;
        public String correctAnswer;
        public String type;
        public String scope;
    }

    private List<RawGeneratedProblem> parseProblemsResponse(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        try {
            String json = extractJsonBlock(raw);
            List<Map<String, Object>> list = objectMapper.readValue(json, new TypeReference<>() {});
            List<RawGeneratedProblem> result = new ArrayList<>();
            for (Map<String, Object> map : list) {
                RawGeneratedProblem p = new RawGeneratedProblem();
                p.question = truncate((String) map.getOrDefault("question", ""), MAX_QUESTION_LENGTH);
                p.correctAnswer = stripOptionSymbol((String) map.getOrDefault("correctAnswer", ""));
                p.type = (String) map.getOrDefault("type", "MULTIPLE_CHOICE");
                p.scope = truncate((String) map.getOrDefault("scope", "기타"), 30);
                @SuppressWarnings("unchecked")
                List<String> opt = (List<String>) map.get("options");
                List<String> sanitized = opt != null
                        ? opt.stream().map(GeminiService::stripOptionSymbol).filter(s -> !s.isBlank()).toList()
                        : List.<String>of();
                if ("MULTIPLE_CHOICE".equalsIgnoreCase(p.type)) {
                    if (sanitized.size() > 5) {
                        sanitized = sanitized.subList(0, 5);
                    }
                    p.options = sanitized.stream()
                            .map(s -> truncate(s, MAX_OPTION_LENGTH))
                            .toList();
                    p.correctAnswer = truncate(p.correctAnswer, MAX_OPTION_LENGTH);
                } else {
                    p.options = sanitized;
                    if ("SHORT_ANSWER".equalsIgnoreCase(p.type)) {
                        p.correctAnswer = truncate(p.correctAnswer, MAX_SHORT_ANSWER_LENGTH);
                    }
                }
                result.add(p);
            }
            return result;
        } catch (Exception e) {
            log.warn("Failed to parse problems JSON", e);
            return List.of();
        }
    }

    private static String truncate(String s, int maxLen) {
        if (s == null) return "";
        s = s.trim();
        if (s.length() <= maxLen) return s;
        return s.substring(0, maxLen);
    }

    private static String stripOptionSymbol(String s) {
        if (s == null) return "";
        s = s.trim();
        // ①~⑤, ⑴~⑽, 1. 2. 3. 4. 5., (1)~(5) 등 제거
        if (s.length() >= 1 && "①②③④⑤⑥⑦⑧⑨⑩⑴⑵⑶⑷⑸".indexOf(s.charAt(0)) >= 0) {
            s = s.substring(1).trim();
        } else if (s.length() >= 2 && s.charAt(1) == '.' && "12345".indexOf(s.charAt(0)) >= 0) {
            s = s.substring(2).trim();
        } else if (s.length() >= 3 && s.startsWith("(") && "12345".indexOf(s.charAt(1)) >= 0 && s.charAt(2) == ')') {
            s = s.substring(3).trim();
        }
        return s;
    }

    public String generateExplanation(String question, List<String> options, String correctAnswer) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("다음 퀴즈 문제에 대한 정답 해설을 작성해 주세요. 학습자가 왜 이 정답이 맞는지, 오답이 왜 틀렸는지 이해할 수 있도록 2~5문장으로 설명해 주세요. 수학/과학/영어 등은 풀이 과정이나 근거를 간단히 포함해 주세요.\n\n");
        prompt.append("【문제】\n").append(question).append("\n\n");
        if (options != null && !options.isEmpty()) {
            prompt.append("【선택지】\n").append(String.join("\n", options)).append("\n\n");
        }
        prompt.append("【정답】\n").append(correctAnswer).append("\n\n【해설】\n");
        String raw = geminiClient.generateText(prompt.toString());
        return (raw != null && !raw.isBlank()) ? raw.trim() : "(해설 생성 실패)";
    }

    private static String extractJsonBlock(String raw) {
        String s = raw.trim();
        int start = s.indexOf('{');
        int arrStart = s.indexOf('[');
        if (arrStart >= 0 && (start < 0 || arrStart < start)) {
            start = arrStart;
        }
        if (start < 0) {
            return s;
        }
        char open = s.charAt(start);
        char close = open == '[' ? ']' : '}';
        int depth = 1;
        int end = start + 1;
        while (end < s.length() && depth > 0) {
            char c = s.charAt(end);
            if (c == open) depth++;
            else if (c == close) depth--;
            end++;
        }
        return depth == 0 ? s.substring(start, end) : s;
    }
}
