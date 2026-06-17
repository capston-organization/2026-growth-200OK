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
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
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

        // ── 영문법 vs 영단어 분기 ──────────────────────────────────────────────
        List<GeminiService.RawGeneratedProblem> rawList;

        if (GameType.GRAMMAR.equals(game.getType())) {
            // 영문법 → FastAPI RAG 파이프라인 (NLP 서버 우선, 실패 시 Gemini fallback)
            log.info("[GameGenerateService] 영문법 게임 - FastAPI RAG 파이프라인 호출");
            rawList = generateProblemsWithFallback(sourceText, count, types, game.getLearningObjectives());
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
            String sourceText, int count, List<ProblemType> types, String learningObjectives) {

        try {
            List<GeminiService.RawGeneratedProblem> nlpResult = nlpClient.generateProblems(
                    sourceText,
                    null,
                    count,
                    types,
                    learningObjectives
            );
            if (nlpResult != null && !nlpResult.isEmpty()) {
                log.info("[GameGenerateService] NLP 서버로 문제 {}개 생성 완료", nlpResult.size());
                return nlpResult;
            }
        } catch (Exception e) {
            log.warn("[GameGenerateService] NLP 서버 호출 실패, Gemini fallback: {}", e.getMessage());
        }

        log.info("[GameGenerateService] Gemini fallback으로 문제 생성");
        return geminiService.generateProblemsFromSource(sourceText, count, types, learningObjectives);
    }

    // ── 유틸 ─────────────────────────────────────────────────────────────────

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

    private User findUser(CustomUserDetails userDetails) {
        return userRepository.findById(userDetails.getUser().getUserId())
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));
    }

    private Game findGame(Long gameId) {
        return gameRepository.findById(gameId)
                .orElseThrow(() -> new CapstonException(ExceptionCode.GAME_NOT_FOUND));
    }
}