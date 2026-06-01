package growth._OK.backend.game.service;

import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.game.domain.Problem;
import growth._OK.backend.game.domain.ProblemAttempt;
import growth._OK.backend.game.dto.ResponseDto.ProblemWithStatusDto;
import growth._OK.backend.game.dto.requestDto.SubmitAnswerRequestDto;
import growth._OK.backend.game.repository.ProblemAttemptRepository;
import growth._OK.backend.game.repository.ProblemRepository;
import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.repository.UserRepository;
import growth._OK.backend.user.service.UserStreakService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProblemAttemptService {

    private final ProblemRepository problemRepository;
    private final ProblemAttemptRepository problemAttemptRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;
    private final UserStreakService userStreakService;

    @Transactional
    public void submitAnswer(Long gameId, Long problemId, SubmitAnswerRequestDto request, CustomUserDetails userDetails) {
        User user = findUser(userDetails);
        Problem problem = findProblem(problemId);
        if (!problem.getGame().getId().equals(gameId)) {
            throw new CapstonException(ExceptionCode.PROBLEM_NOT_FOUND);
        }
        List<ProblemAttempt> attempts = problemAttemptRepository.findByUserAndProblemOrderByAttemptOrderAsc(user, problem);
        int nextOrder = attempts.size() + 1;
        problemAttemptRepository.save(ProblemAttempt.builder()
                .user(user)
                .problem(problem)
                .correct(Boolean.TRUE.equals(request.getCorrect()))
                .attemptOrder(nextOrder)
                .responseTimeMs(request.getResponseTimeMs())
                .hintUsed(Boolean.TRUE.equals(request.getHintUsed()))
                .explanationOpened(Boolean.TRUE.equals(request.getExplanationOpened()))
                .chosenAnswer(request.getChosenAnswer())
                .submittedText(request.getSubmittedText())
                .build());
        userStreakService.recordPlayToday(user.getUserId());
    }

    @Transactional(readOnly = true)
    public List<ProblemWithStatusDto> getWrongProblems(Long gameId, CustomUserDetails userDetails) {
        User user = findUser(userDetails);
        return getProblemsForGame(gameId).stream()
                .filter(p -> isFirstAttemptWrong(user, p))
                .map(p -> toProblemWithStatusDto(p, user, true))
                .collect(Collectors.toList());
    }

    @Transactional
    public String getOrCreateExplanation(Long gameId, Long problemId, CustomUserDetails userDetails) {
        findUser(userDetails);
        Problem problem = findProblem(problemId);
        if (!problem.getGame().getId().equals(gameId)) {
            throw new CapstonException(ExceptionCode.PROBLEM_NOT_FOUND);
        }
        if (problem.getExplanation() != null && !problem.getExplanation().isBlank()) {
            return problem.getExplanation();
        }
        List<String> options = parseOptionsJson(problem.getOptionsJson());
        String generated = geminiService.generateExplanation(problem.getQuestion(), options, problem.getCorrectAnswer());
        problem.setExplanation(generated);
        return generated;
    }

    @Transactional(readOnly = true)
    public List<ProblemWithStatusDto> getAllProblemsWithStatusAndExplanation(Long gameId, CustomUserDetails userDetails) {
        User user = findUser(userDetails);
        return getProblemsForGame(gameId).stream()
                .map(p -> toProblemWithStatusDto(p, user, false))
                .collect(Collectors.toList());
    }

    private List<Problem> getProblemsForGame(Long gameId) {
        return problemRepository.findByGame_IdOrderBySortOrderAsc(gameId);
    }

    private boolean isFirstAttemptWrong(User user, Problem problem) {
        Optional<ProblemAttempt> first = problemAttemptRepository.findFirstByUserAndProblemOrderByAttemptOrderAsc(user, problem);
        return first.map(a -> !a.isCorrect()).orElse(false);
    }

    private ProblemWithStatusDto toProblemWithStatusDto(Problem p, User user, boolean explanationIfMissing) {
        Boolean firstCorrect = problemAttemptRepository.findFirstByUserAndProblemOrderByAttemptOrderAsc(user, p)
                .map(a -> a.isCorrect())
                .orElse(null);
        String explanation = p.getExplanation() != null ? p.getExplanation() : "";
        if (explanationIfMissing && explanation.isBlank()) {
            explanation = "(해설 없음)";
        }
        return ProblemWithStatusDto.builder()
                .id(p.getId())
                .question(p.getQuestion())
                .options(parseOptionsJson(p.getOptionsJson()))
                .correctAnswer(p.getCorrectAnswer())
                .type(p.getType())
                .sortOrder(p.getSortOrder())
                .firstAttemptCorrect(firstCorrect)
                .explanation(explanation)
                .build();
    }

    private static List<String> parseOptionsJson(String optionsJson) {
        if (optionsJson == null || optionsJson.isBlank()) {
            return List.of();
        }
        try {
            return List.of(optionsJson.replace("[", "").replace("]", "").replace("\"", "").split(","));
        } catch (Exception e) {
            return List.of();
        }
    }

    private User findUser(CustomUserDetails userDetails) {
        return userRepository.findById(userDetails.getUser().getUserId())
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));
    }

    private Problem findProblem(Long problemId) {
        return problemRepository.findById(problemId)
                .orElseThrow(() -> new CapstonException(ExceptionCode.PROBLEM_NOT_FOUND));
    }
}
