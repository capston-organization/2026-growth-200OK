package growth._OK.backend.analysis.service;

import growth._OK.backend.analysis.dto.request.CreateReviewGameRequestDto;
import growth._OK.backend.analysis.dto.response.AnalysisDetailResponseDto;
import growth._OK.backend.analysis.dto.response.AnalysisOverviewResponseDto;
import growth._OK.backend.analysis.dto.response.CategoryScopeWrongRateDto;
import growth._OK.backend.analysis.dto.response.CreateReviewGameResponseDto;
import growth._OK.backend.analysis.dto.response.ScopeWrongRateDto;
import growth._OK.backend.analysis.dto.response.ScopeInsightDto;
import growth._OK.backend.analysis.dto.response.WrongAnswerItemDto;
import growth._OK.backend.analysis.dto.response.WrongAnswerListResponseDto;
import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.game.domain.GameType;
import growth._OK.backend.game.domain.Problem;
import growth._OK.backend.game.domain.ProblemAttempt;
import growth._OK.backend.game.dto.ResponseDto.GameResponseDto;
import growth._OK.backend.game.dto.requestDto.GameCreateRequestDto;
import growth._OK.backend.game.repository.ProblemAttemptRepository;
import growth._OK.backend.game.service.GameService;
import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final UserRepository userRepository;
    private final ProblemAttemptRepository problemAttemptRepository;
    private final AnalysisGeminiService analysisGeminiService;
    private final GameService gameService;

    @Transactional(readOnly = true)
    public AnalysisOverviewResponseDto getOverview(CustomUserDetails userDetails) {
        User user = findUser(userDetails);
        BaseAnalysisData base = buildBaseData(user);
        List<ProblemAttempt> attempts = problemAttemptRepository.findByUserOrderByCreatedAtAsc(user);

        Map<String, Integer> totalByCategory = new LinkedHashMap<>();
        totalByCategory.put("WORD", 0);
        totalByCategory.put("GRAMMAR", 0);

        Map<String, Map<String, Integer>> wrongScopeCountByCategory = new LinkedHashMap<>();
        wrongScopeCountByCategory.put("WORD", new LinkedHashMap<>());
        wrongScopeCountByCategory.put("GRAMMAR", new LinkedHashMap<>());

        for (ProblemAttempt attempt : attempts) {
            String category = toCategory(attempt.getProblem().getGame().getType());
            totalByCategory.put(category, totalByCategory.getOrDefault(category, 0) + 1);

            if (attempt.isCorrect()) continue;

            String scope = normalizeScope(attempt.getProblem());
            Map<String, Integer> scopeMap = wrongScopeCountByCategory.get(category);
            scopeMap.put(scope, scopeMap.getOrDefault(scope, 0) + 1);
        }

        List<CategoryScopeWrongRateDto> categoryDtos = new ArrayList<>();
        for (String category : List.of("WORD", "GRAMMAR")) {
            int total = totalByCategory.getOrDefault(category, 0);
            Map<String, Integer> counts = wrongScopeCountByCategory.getOrDefault(category, Map.of());

            List<ScopeWrongRateDto> scopes = counts.entrySet().stream()
                    .sorted((a, b) -> Integer.compare(b.getValue(), a.getValue()))
                    .map(entry -> {
                        int rate = total == 0 ? 0 : (int) Math.round((entry.getValue() * 100.0) / total);
                        return ScopeWrongRateDto.builder()
                                .scope(entry.getKey())
                                .wrongRate(rate)
                                .build();
                    })
                    .collect(Collectors.toList());

            categoryDtos.add(CategoryScopeWrongRateDto.builder()
                    .category(category)
                    .scopes(scopes)
                    .build());
        }

        return AnalysisOverviewResponseDto.builder()
                .weakTop3(base.weakTop3())
                .scopeWrongRates(categoryDtos)
                .build();
    }

    @Transactional(readOnly = true)
    public AnalysisDetailResponseDto getDetail(CustomUserDetails userDetails) {
        User user = findUser(userDetails);
        List<ProblemAttempt> attempts = problemAttemptRepository.findByUserOrderByCreatedAtAsc(user);

        int totalAttempts = attempts.size();
        int totalWrongCount = (int) attempts.stream().filter(a -> !a.isCorrect()).count();
        int wrongRate = totalAttempts == 0 ? 0 : (int) Math.round(totalWrongCount * 100.0 / totalAttempts);

        int avgResponseTimeMs = (int) Math.round(
                attempts.stream()
                        .map(ProblemAttempt::getResponseTimeMs)
                        .filter(Objects::nonNull)
                        .mapToInt(Integer::intValue)
                        .average()
                        .orElse(0)
        );

        int hintUseCount = (int) attempts.stream().filter(ProblemAttempt::isHintUsed).count();
        int hintUseRate = totalAttempts == 0 ? 0 : (int) Math.round(hintUseCount * 100.0 / totalAttempts);

        Map<String, List<ProblemAttempt>> grouped = attempts.stream()
                .collect(Collectors.groupingBy(a ->
                                toCategory(a.getProblem().getGame().getType()) + "||" + normalizeScope(a.getProblem()),
                        LinkedHashMap::new,
                        Collectors.toList()));

        List<ScopeInsightDto> scopeInsights = grouped.entrySet().stream()
                .map(entry -> {
                    String[] key = entry.getKey().split("\\|\\|", 2);
                    String category = key[0];
                    String scope = key.length > 1 ? key[1] : "기타";
                    List<ProblemAttempt> rows = entry.getValue();
                    int attemptsCount = rows.size();
                    int wrongCount = (int) rows.stream().filter(a -> !a.isCorrect()).count();
                    int rate = attemptsCount == 0 ? 0 : (int) Math.round(wrongCount * 100.0 / attemptsCount);
                    int scopeAvgMs = (int) Math.round(rows.stream()
                            .map(ProblemAttempt::getResponseTimeMs)
                            .filter(Objects::nonNull)
                            .mapToInt(Integer::intValue)
                            .average()
                            .orElse(0));
                    return ScopeInsightDto.builder()
                            .category(category)
                            .scope(scope)
                            .attemptCount(attemptsCount)
                            .wrongCount(wrongCount)
                            .wrongRate(rate)
                            .avgResponseTimeMs(scopeAvgMs)
                            .build();
                })
                .sorted((a, b) -> Integer.compare(b.getWrongRate(), a.getWrongRate()))
                .limit(10)
                .collect(Collectors.toList());

        return AnalysisDetailResponseDto.builder()
                .totalAttempts(totalAttempts)
                .totalWrongCount(totalWrongCount)
                .wrongRate(wrongRate)
                .avgResponseTimeMs(avgResponseTimeMs)
                .hintUseRate(hintUseRate)
                .scopeInsights(scopeInsights)
                .build();
    }

    @Transactional(readOnly = true)
    public WrongAnswerListResponseDto getWrongAnswers(
            CustomUserDetails userDetails,
            String category,
            String scope,
            LocalDate fromDate,
            LocalDate toDate
    ) {
        User user = findUser(userDetails);
        BaseAnalysisData base = buildBaseData(user);
        String normalizedCategory = normalizeCategory(category);

        List<WrongAnswerItemDto> items = base.wrongs().stream()
                .filter(w -> normalizedCategory == null || normalizedCategory.equals(w.category()))
                .filter(w -> scope == null || scope.isBlank() || Objects.equals(base.scopeByProblem().get(w.problemId()), scope))
                .filter(w -> fromDate == null || w.wrongDate() == null || !w.wrongDate().isBefore(fromDate))
                .filter(w -> toDate == null || w.wrongDate() == null || !w.wrongDate().isAfter(toDate))
                .sorted(Comparator.comparing(WrongSeed::wrongDate, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(w -> WrongAnswerItemDto.builder()
                        .gameId(w.gameId())
                        .problemId(w.problemId())
                        .category(w.category())
                        .scope(base.scopeByProblem().getOrDefault(w.problemId(), "기타"))
                        .question(w.question())
                        .answer(w.answer())
                        .wrongDate(w.wrongDate())
                        .build())
                .collect(Collectors.toList());

        return WrongAnswerListResponseDto.builder()
                .items(items)
                .build();
    }

    @Transactional
    public CreateReviewGameResponseDto createReviewGame(CustomUserDetails userDetails, CreateReviewGameRequestDto request) {
        String category = normalizeCategory(request != null ? request.getCategory() : null);
        if (category == null) {
            category = "WORD";
        }
        String scope = (request != null && request.getScope() != null && !request.getScope().isBlank())
                ? request.getScope().trim()
                : "핵심 개념";

        String title = "[복습] " + scope;
        String description = analysisGeminiService.generateReviewDescription(category, scope);

        GameCreateRequestDto createRequest = GameCreateRequestDto.builder()
                .type("GRAMMAR".equals(category) ? GameType.GRAMMAR : GameType.VOCAB)
                .title(title)
                .description(description)
                .learningObjectives(scope + " 중심 오답 복습")
                .isPublic(false)
                .problemCount(10)
                .build();

        GameResponseDto game = gameService.createGame(createRequest, userDetails);
        return CreateReviewGameResponseDto.builder()
                .gameId(game.getId())
                .status("PREPARING")
                .nextPage("/play?status=preparing")
                .build();
    }

    private BaseAnalysisData buildBaseData(User user) {
        List<ProblemAttempt> attempts = problemAttemptRepository.findByUserOrderByCreatedAtAsc(user);
        Map<Long, ProblemAttempt> firstAttempts = new LinkedHashMap<>();
        for (ProblemAttempt attempt : attempts) {
            Long problemId = attempt.getProblem().getId();
            firstAttempts.putIfAbsent(problemId, attempt);
        }

        List<WrongSeed> wrongs = new ArrayList<>();
        for (ProblemAttempt first : firstAttempts.values()) {
            if (first.isCorrect()) continue;
            Problem problem = first.getProblem();
            wrongs.add(new WrongSeed(
                    problem.getGame().getId(),
                    problem.getId(),
                    toCategory(problem.getGame().getType()),
                    problem.getQuestion(),
                    resolveUserAnswer(first, problem),
                    first.getCreatedAt() != null ? first.getCreatedAt().toLocalDate() : null,
                    problem
            ));
        }

        AnalysisGeminiService.AnalysisAiResult aiResult = analysisGeminiService.analyzeWrongProblems(wrongs);
        Map<Long, String> scopeByProblem = new LinkedHashMap<>();
        for (WrongSeed wrong : wrongs) {
            AnalysisGeminiService.ScopeCategory sc = aiResult.perProblem().get(wrong.problemId());
            String scope = (sc != null && sc.scope() != null && !sc.scope().isBlank())
                    ? sc.scope()
                    : normalizeScope(wrong.problem());
            scopeByProblem.put(wrong.problemId(), scope);
        }

        List<String> weakTop3 = new ArrayList<>(aiResult.weakTop3());
        if (weakTop3.isEmpty()) {
            weakTop3 = scopeByProblem.values().stream()
                    .collect(Collectors.groupingBy(v -> v, LinkedHashMap::new, Collectors.counting()))
                    .entrySet().stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .limit(3)
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList());
        }
        while (weakTop3.size() < 3) {
            weakTop3.add("기초 개념");
        }

        return new BaseAnalysisData(firstAttempts, wrongs, scopeByProblem, weakTop3);
    }

    private static String fallbackScope(String question) {
        if (question == null || question.isBlank()) return "기타";
        if (question.contains("which") || question.contains("who") || question.contains("that")) return "관계대명사";
        if (question.contains("it")) return "가주어 it";
        if (question.contains("조건")) return "조건문";
        if (question.contains("동의어")) return "동의어";
        return "기타";
    }

    private static String normalizeScope(Problem problem) {
        if (problem.getScope() != null && !problem.getScope().isBlank()) {
            return problem.getScope();
        }
        return fallbackScope(problem.getQuestion());
    }

    private static String resolveUserAnswer(ProblemAttempt attempt, Problem problem) {
        if (attempt.getSubmittedText() != null && !attempt.getSubmittedText().isBlank()) {
            return attempt.getSubmittedText();
        }
        if (attempt.getChosenAnswer() != null && !attempt.getChosenAnswer().isBlank()) {
            return attempt.getChosenAnswer();
        }
        return problem.getCorrectAnswer();
    }

    private static String toCategory(GameType gameType) {
        return gameType == GameType.GRAMMAR ? "GRAMMAR" : "WORD";
    }

    private static String normalizeCategory(String category) {
        if (category == null || category.isBlank()) return null;
        if ("GRAMMAR".equalsIgnoreCase(category)) return "GRAMMAR";
        if ("WORD".equalsIgnoreCase(category)) return "WORD";
        return null;
    }

    private User findUser(CustomUserDetails userDetails) {
        return userRepository.findById(userDetails.getUser().getUserId())
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));
    }

    public record WrongSeed(
            Long gameId,
            Long problemId,
            String category,
            String question,
            String answer,
            LocalDate wrongDate,
            Problem problem
    ) {}

    private record BaseAnalysisData(
            Map<Long, ProblemAttempt> firstAttempts,
            List<WrongSeed> wrongs,
            Map<Long, String> scopeByProblem,
            List<String> weakTop3
    ) {}
}
