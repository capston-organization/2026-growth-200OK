package growth._OK.backend.game.service;

import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.game.client.NlpClient;
import growth._OK.backend.game.domain.Game;
import growth._OK.backend.game.domain.GameSource;
import growth._OK.backend.game.domain.GameType;
import growth._OK.backend.game.domain.Problem;
import growth._OK.backend.game.domain.ProblemType;
import growth._OK.backend.game.dto.ResponseDto.GamePreviewResponseDto;
import growth._OK.backend.game.dto.ResponseDto.GeneratedProblemDto;
import growth._OK.backend.game.dto.requestDto.GameGenerateProblemsRequestDto;
import growth._OK.backend.game.repository.GameRepository;
import growth._OK.backend.game.repository.ProblemRepository;
import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameGenerateService {

    private final GameRepository gameRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;
    private final NlpClient nlpClient;
    private final ObjectMapper objectMapper;

    // scope(한국어) -> grammar_tag 매핑
    private static final Map<String, String> SCOPE_TO_TAG = Map.ofEntries(
            Map.entry("수일치", "subject_verb_agreement"),
            Map.entry("현재시제", "tense_present"),
            Map.entry("과거시제", "tense_past"),
            Map.entry("조동사", "auxiliary_verb"),
            Map.entry("전치사", "preposition"),
            Map.entry("관사", "article"),
            Map.entry("비교급", "comparative"),
            Map.entry("to부정사", "to_infinitive"),
            Map.entry("수동태", "passive_voice"),
            Map.entry("문장구조", "basic_word_order")
    );

    @Transactional
    public GamePreviewResponseDto generatePreview(Long gameId, CustomUserDetails userDetails) {
        findUser(userDetails);
        Game game = findGame(gameId);
        GameSource source = game.getSource();
        if (source == null) {
            throw new CapstonException(ExceptionCode.GAME_SOURCE_NOT_SET);
        }
        if (game.getPreviewLearningObjectives() != null && game.getPreviewLearningContent() != null
                && !game.getPreviewLearningObjectives().isBlank() && !game.getPreviewLearningContent().isBlank()) {
            return GamePreviewResponseDto.builder()
                    .description(game.getDescription() != null ? game.getDescription() : "")
                    .learningObjectives(game.getPreviewLearningObjectives())
                    .learningContent(game.getPreviewLearningContent())
                    .build();
        }
        String sourceText = source.getExtractedText();
        GamePreviewResponseDto dto = geminiService.generatePreviewFromSource(game.getDescription(), sourceText);
        savePreviewCache(gameId, dto);
        return dto;
    }

    @Transactional
    public void savePreviewCache(Long gameId, GamePreviewResponseDto dto) {
        Game game = findGame(gameId);
        game.setPreviewCache(
                dto.getLearningObjectives() != null ? dto.getLearningObjectives() : "",
                dto.getLearningContent() != null ? dto.getLearningContent() : ""
        );
    }

    @Transactional
    public List<GeneratedProblemDto> generateProblems(Long gameId, GameGenerateProblemsRequestDto request,
                                                      CustomUserDetails userDetails) {
        findUser(userDetails);
        Game game = findGame(gameId);
        if (game.getSource() == null) {
            throw new CapstonException(ExceptionCode.GAME_SOURCE_NOT_SET);
        }

        // 이미 생성된 문제가 있으면 그대로 반환
        List<Problem> existing = problemRepository.findByGame_IdOrderBySortOrderAsc(gameId);
        if (!existing.isEmpty()) {
            return existing.stream()
                    .map(p -> GeneratedProblemDto.builder()
                            .id(p.getId())
                            .question(p.getQuestion())
                            .options(parseOptionsJson(p.getOptionsJson()))
                            .correctAnswer(p.getCorrectAnswer())
                            .type(p.getType())
                            .sortOrder(p.getSortOrder())
                            .build())
                    .collect(Collectors.toList());
        }

        int count = request.getProblemCount() != null && request.getProblemCount() > 0
                ? request.getProblemCount()
                : game.getProblemCount();
        List<ProblemType> types = request.getProblemTypes() != null && !request.getProblemTypes().isEmpty()
                ? request.getProblemTypes()
                : game.getAllowedProblemTypes().isEmpty() ? List.of(ProblemType.MULTIPLE_CHOICE) : game.getAllowedProblemTypes();

        String sourceText = game.getSource().getExtractedText();
        String targetScope = resolveTargetScopeHint(game.getLearningObjectives());

        // ── 영문법 vs 영단어 분기 ──────────────────────────────────────────────
        List<GeminiService.RawGeneratedProblem> rawList;

        if (GameType.GRAMMAR.equals(game.getType())) {
            // 영문법 → FastAPI RAG 파이프라인 (NLP 서버 우선, 실패 시 Gemini fallback)
            log.info("[GameGenerateService] 영문법 게임 - FastAPI RAG 파이프라인 호출");
            rawList = generateProblemsWithFallback(
                    sourceText,
                    count,
                    types,
                    game.getLearningObjectives(),
                    targetScope
            );

            // 복습 게임처럼 타깃 범위가 있으면 최종 결과도 한 번 더 제한
            if (targetScope != null && !targetScope.isBlank()) {
                rawList = filterByTargetScope(rawList, targetScope);
            }
        } else {
            // 영단어 → GeminiService 직접 호출 (영단어 전용 프롬프트)
            log.info("[GameGenerateService] 영단어 게임 - Gemini 직접 호출");
            rawList = geminiService.generateProblemsFromSource(sourceText, count, types, game.getLearningObjectives());
        }

        if (rawList.size() > count) {
            rawList = new ArrayList<>(rawList.subList(0, count));
        }

        // DB 저장
        List<Problem> saved = new ArrayList<>();
        for (int i = 0; i < rawList.size(); i++) {
            GeminiService.RawGeneratedProblem raw = rawList.get(i);
            ProblemType pt = parseProblemType(raw.type);
            String optionsJson = toOptionsJson(raw.options);
            Problem problem = Problem.builder()
                    .game(game)
                    .sortOrder(i + 1)
                    .question(raw.question != null ? raw.question : "문제 " + (i + 1))
                    .optionsJson(optionsJson)
                    .correctAnswer(raw.correctAnswer != null ? raw.correctAnswer : "")
                    .type(pt)
                    .scope(raw.scope != null && !raw.scope.isBlank() ? raw.scope : "기타")
                    .explanation(raw.explanation)
                    .build();
            saved.add(problemRepository.save(problem));
        }

        // 부족한 문제 패딩
        for (int i = rawList.size(); i < count; i++) {
            Problem problem = Problem.builder()
                    .game(game)
                    .sortOrder(i + 1)
                    .question("추가 문제 " + (i + 1))
                    .optionsJson("[\"①\",\"②\",\"③\",\"④\",\"⑤\"]")
                    .correctAnswer("①")
                    .type(types.isEmpty() ? ProblemType.MULTIPLE_CHOICE : types.get(i % types.size()))
                    .scope("기타")
                    .explanation(null)
                    .build();
            saved.add(problemRepository.save(problem));
        }

        return saved.stream()
                .map(p -> GeneratedProblemDto.builder()
                        .id(p.getId())
                        .question(p.getQuestion())
                        .options(parseOptionsJson(p.getOptionsJson()))
                        .correctAnswer(p.getCorrectAnswer())
                        .type(p.getType())
                        .sortOrder(p.getSortOrder())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 영문법 RAG Pipeline:
     * 1. NLP 서버(FastAPI) 호출 시도
     * 2. 실패 시 → Gemini fallback
     */
    private List<GeminiService.RawGeneratedProblem> generateProblemsWithFallback(
            String sourceText,
            int count,
            List<ProblemType> types,
            String learningObjectives,
            String targetScope
    ) {
        List<String> grammarTags = resolveGrammarTags(learningObjectives, targetScope);
        String personalizationContext = appendScopeConstraint(learningObjectives, targetScope);

        try {
            List<GeminiService.RawGeneratedProblem> nlpResult = nlpClient.generateProblems(
                    sourceText,
                    grammarTags,
                    count,
                    types,
                    personalizationContext
            );
            if (nlpResult != null && !nlpResult.isEmpty()) {
                if (targetScope != null && !targetScope.isBlank()) {
                    List<GeminiService.RawGeneratedProblem> scoped = filterByTargetScope(nlpResult, targetScope);
                    log.info("[GameGenerateService] NLP 생성 {}개 중 scope '{}' 일치 {}개",
                            nlpResult.size(), targetScope, scoped.size());
                    if (!scoped.isEmpty()) {
                        return scoped;
                    }
                } else {
                    log.info("[GameGenerateService] NLP 서버로 문제 {}개 생성 완료", nlpResult.size());
                    return nlpResult;
                }
            }
        } catch (Exception e) {
            log.warn("[GameGenerateService] NLP 서버 호출 실패, Gemini fallback: {}", e.getMessage());
        }

        log.info("[GameGenerateService] Gemini fallback으로 문제 생성");
        return geminiService.generateProblemsFromSource(sourceText, count, types, personalizationContext);
    }

    // ── 유틸 ─────────────────────────────────────────────────────────────────

    private List<String> resolveGrammarTags(String learningObjectives, String targetScope) {
        if (targetScope != null && !targetScope.isBlank()) {
            String mappedTag = mapScopeToTag(targetScope);
            if (mappedTag != null) {
                return List.of(mappedTag);
            }
        }
        return extractGrammarTags(learningObjectives);
    }

    /**
     * learningObjectives에서 한국어 scope를 찾아 grammar_tag로 변환.
     * 복습 게임에서 취약 문법 태그를 FastAPI에 전달하기 위함.
     */
    private List<String> extractGrammarTags(String learningObjectives) {
        if (learningObjectives == null || learningObjectives.isBlank()) {
            return null;
        }
        List<String> tags = new ArrayList<>();
        for (Map.Entry<String, String> entry : SCOPE_TO_TAG.entrySet()) {
            if (learningObjectives.contains(entry.getKey())) {
                tags.add(entry.getValue());
            }
        }
        return tags.isEmpty() ? null : tags;
    }

    private String mapScopeToTag(String scope) {
        if (scope == null || scope.isBlank()) {
            return null;
        }
        String normalized = normalizeForMatch(scope);
        for (Map.Entry<String, String> entry : SCOPE_TO_TAG.entrySet()) {
            String key = normalizeForMatch(entry.getKey());
            if (normalized.equals(key) || normalized.contains(key) || key.contains(normalized)) {
                return entry.getValue();
            }
        }
        return null;
    }

    private static ProblemType parseProblemType(String type) {
        if (type == null) return ProblemType.MULTIPLE_CHOICE;
        try {
            return ProblemType.valueOf(type.toUpperCase().replace(" ", "_"));
        } catch (Exception e) {
            return ProblemType.MULTIPLE_CHOICE;
        }
    }

    private String toOptionsJson(List<String> options) {
        if (options == null || options.isEmpty()) return "[]";
        try {
            return objectMapper.writeValueAsString(options);
        } catch (Exception e) {
            return "[]";
        }
    }

    private static List<String> parseOptionsJson(String optionsJson) {
        if (optionsJson == null || optionsJson.isBlank()) {
            return List.of();
        }
        try {
            return java.util.Arrays.asList(
                    optionsJson.replace("[", "").replace("]", "").replace("\"", "").split(","));
        } catch (Exception e) {
            return List.of();
        }
    }

    private String appendScopeConstraint(String learningObjectives, String targetScope) {
        String base = learningObjectives != null ? learningObjectives : "";
        if (targetScope == null || targetScope.isBlank()) {
            return base;
        }
        return (base + """

                [SCOPE_STRICT]
                - 이번 생성은 '%s' 범위만 다룹니다.
                - '%s' 이외의 문법 주제(예: 주어-동사 수일치, 시제 등)는 출제하지 마세요.
                - 모든 문제의 scope는 반드시 '%s' 또는 '%s'의 하위 개념이어야 합니다.
                """.formatted(targetScope, targetScope, targetScope, targetScope)).trim();
    }

    private static List<GeminiService.RawGeneratedProblem> filterByTargetScope(
            List<GeminiService.RawGeneratedProblem> problems,
            String targetScope
    ) {
        if (problems == null || problems.isEmpty() || targetScope == null || targetScope.isBlank()) {
            return problems == null ? List.of() : problems;
        }

        String target = normalizeForMatch(targetScope);
        List<GeminiService.RawGeneratedProblem> filtered = problems.stream()
                .filter(p -> {
                    String scope = normalizeForMatch(p.scope);
                    String question = normalizeForMatch(p.question);
                    return (!scope.isBlank() && (scope.contains(target) || target.contains(scope)))
                            || (!question.isBlank() && question.contains(target));
                })
                .collect(Collectors.toCollection(ArrayList::new));

        if (filtered.isEmpty()) {
            return List.of();
        }

        // 저장 시 분석 일관성을 위해 scope를 타깃으로 정규화
        for (GeminiService.RawGeneratedProblem p : filtered) {
            p.scope = targetScope;
        }
        return filtered;
    }

    private static String normalizeForMatch(String value) {
        if (value == null) return "";
        return value.replace(" ", "")
                .replace("-", "")
                .replace("_", "")
                .toLowerCase(Locale.ROOT)
                .trim();
    }

    private String resolveTargetScopeHint(String learningObjectives) {
        if (learningObjectives == null || learningObjectives.isBlank()) {
            return null;
        }

        String text = learningObjectives.trim();

        // reviewProfile JSON에 targetScope가 있으면 최우선 사용
        int jsonStart = text.indexOf('{');
        if (jsonStart >= 0) {
            String candidate = text.substring(jsonStart).trim();
            try {
                JsonNode node = objectMapper.readTree(candidate);
                String fromJson = node.path("targetScope").asText("").trim();
                if (!fromJson.isBlank()) {
                    return fromJson;
                }
            } catch (Exception ignored) {
                // reviewProfile 포맷이 아닐 수 있으므로 무시
            }
        }

        // "<scope> 중심 오답 복습" 형태 지원
        int marker = text.indexOf("중심 오답 복습");
        if (marker > 0) {
            String scope = text.substring(0, marker).trim();
            if (!scope.isBlank()) {
                return scope;
            }
        }
        return null;
    }

    private User findUser(CustomUserDetails userDetails) {
        return userRepository.findById(userDetails.getUser().getUserId())
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));
    }

    private Game findGame(Long gameId) {
        return gameRepository.findById(gameId)
                .orElseThrow(() -> new CapstonException(ExceptionCode.GAME_NOT_FOUND));
    }
}