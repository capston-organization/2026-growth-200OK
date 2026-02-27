package growth._OK.backend.game.service;

import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.game.domain.Game;
import growth._OK.backend.game.domain.GameSource;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GameGenerateService {

    private final GameRepository gameRepository;
    private final ProblemRepository problemRepository;
    private final UserRepository userRepository;
    private final GeminiService geminiService;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public GamePreviewResponseDto generatePreview(Long gameId, CustomUserDetails userDetails) {
        findUser(userDetails);
        Game game = findGame(gameId);
        GameSource source = game.getSource();
        if (source == null) {
            throw new CapstonException(ExceptionCode.GAME_SOURCE_NOT_SET);
        }
        String sourceText = source.getExtractedText();
        return geminiService.generatePreviewFromSource(game.getDescription(), sourceText);
    }

    @Transactional
    public List<GeneratedProblemDto> generateProblems(Long gameId, GameGenerateProblemsRequestDto request,
                                                      CustomUserDetails userDetails) {
        findUser(userDetails);
        Game game = findGame(gameId);
        if (game.getSource() == null) {
            throw new CapstonException(ExceptionCode.GAME_SOURCE_NOT_SET);
        }

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
        List<GeminiService.RawGeneratedProblem> rawList = geminiService.generateProblemsFromSource(sourceText, count, types);

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
                    .explanation(null)
                    .build();
            saved.add(problemRepository.save(problem));
        }
        for (int i = rawList.size(); i < count; i++) {
            Problem problem = Problem.builder()
                    .game(game)
                    .sortOrder(i + 1)
                    .question("추가 문제 " + (i + 1))
                    .optionsJson("[\"①\",\"②\",\"③\",\"④\",\"⑤\"]")
                    .correctAnswer("①")
                    .type(types.isEmpty() ? ProblemType.MULTIPLE_CHOICE : types.get(i % types.size()))
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
            return java.util.Arrays.asList(optionsJson.replace("[", "").replace("]", "").replace("\"", "").split(","));
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
