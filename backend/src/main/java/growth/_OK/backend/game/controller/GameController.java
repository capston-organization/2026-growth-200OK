package growth._OK.backend.game.controller;

import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.game.dto.ResponseDto.GameListResponseDto;
import growth._OK.backend.game.dto.ResponseDto.GamePreviewResponseDto;
import growth._OK.backend.game.dto.ResponseDto.GeneratedProblemDto;
import growth._OK.backend.game.dto.ResponseDto.GameResponseDto;
import growth._OK.backend.game.dto.ResponseDto.ProblemWithStatusDto;
import growth._OK.backend.game.dto.requestDto.GameCreateRequestDto;
import growth._OK.backend.game.dto.requestDto.GameGenerateProblemsRequestDto;
import growth._OK.backend.game.dto.requestDto.SubmitAnswerRequestDto;
import growth._OK.backend.game.service.GameGenerateService;
import growth._OK.backend.game.service.GameService;
import growth._OK.backend.game.service.GameSourceService;
import growth._OK.backend.game.service.ProblemAttemptService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/games")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;
    private final GameSourceService gameSourceService;
    private final GameGenerateService gameGenerateService;
    private final ProblemAttemptService problemAttemptService;

    // 게임 생성
    @PostMapping
    public ResponseEntity<GameResponseDto> createGame(@AuthenticationPrincipal CustomUserDetails user,
                                                      @RequestBody GameCreateRequestDto request) {
        GameResponseDto created = gameService.createGame(request, user);
        URI location = URI.create("/games/" + created.getId());
        return ResponseEntity.created(location).body(created);
    }

    // 소스 업로드 (PDF/텍스트). 해당 게임에 연결. 먼저 POST /games 로 게임 생성 후 호출.
    @PostMapping("/{gameId}/sources")
    public ResponseEntity<Map<String, Long>> uploadSource(@PathVariable Long gameId,
                                                          @AuthenticationPrincipal CustomUserDetails user,
                                                          @RequestParam("file") MultipartFile file) {
        Long sourceId = gameSourceService.uploadSource(gameId, file, user);
        return ResponseEntity.ok(Map.of("sourceId", sourceId));
    }

    // 1단계: 게임 설명, 학습 목표, 학습할 내용만 먼저 반환. 게임에 연결된 소스 사용. 소스 없으면 에러.
    @PostMapping("/{gameId}/generate/preview")
    public ResponseEntity<GamePreviewResponseDto> generatePreview(@PathVariable Long gameId,
                                                                  @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(gameGenerateService.generatePreview(gameId, user));
    }

    // 2단계: 게임 문제 생성 후 해당 게임에 저장. 게임에 연결된 소스로 생성.
    @PostMapping("/{gameId}/generate/problems")
    public ResponseEntity<Map<String, List<GeneratedProblemDto>>> generateProblems(
            @PathVariable Long gameId,
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody GameGenerateProblemsRequestDto request) {
        return ResponseEntity.ok(Map.of("problems", gameGenerateService.generateProblems(gameId, request, user)));
    }

    // 문제 제출: 정답/오답 기록. body: { "correct": true | false }
    @PostMapping("/{gameId}/problems/{problemId}/submit")
    public ResponseEntity<Void> submitAnswer(@PathVariable Long gameId,
                                             @PathVariable Long problemId,
                                             @AuthenticationPrincipal CustomUserDetails user,
                                             @RequestBody SubmitAnswerRequestDto request) {
        if (request.getCorrect() == null) {
            return ResponseEntity.badRequest().build();
        }
        problemAttemptService.submitAnswer(gameId, problemId, request.getCorrect(), user);
        return ResponseEntity.noContent().build();
    }

    // 틀린 문제만 조회 (오답 노트). 첫 시도에서 오답이었던 문제 목록
    @GetMapping("/{gameId}/problems/wrong")
    public ResponseEntity<List<ProblemWithStatusDto>> getWrongProblems(@PathVariable Long gameId,
                                                                        @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(problemAttemptService.getWrongProblems(gameId, user));
    }

    // 문제 해설 조회. 없으면 Gemini로 생성 후 저장하고 반환. GET 또는 POST 모두 지원
    @RequestMapping(value = "/{gameId}/problems/{problemId}/explanation", method = {RequestMethod.GET, RequestMethod.POST})
    public ResponseEntity<Map<String, String>> getExplanation(@PathVariable Long gameId,
                                                              @PathVariable Long problemId,
                                                              @AuthenticationPrincipal CustomUserDetails user) {
        String explanation = problemAttemptService.getOrCreateExplanation(gameId, problemId, user);
        return ResponseEntity.ok(Map.of("explanation", explanation != null ? explanation : ""));
    }

    /** 문제 전체 조회. 각 문제별 상태(맞음/틀림/오답 후 정답) + 해설. 해설 없으면 Gemini로 생성 후 포함 */
    @GetMapping("/{gameId}/problems")
    public ResponseEntity<List<ProblemWithStatusDto>> getAllProblems(@PathVariable Long gameId,
                                                                      @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(problemAttemptService.getAllProblemsWithStatusAndExplanation(gameId, user));
    }

    // 게임 전체 조회 + 제목 검색
    @GetMapping
    public ResponseEntity<GameListResponseDto> getGames(@AuthenticationPrincipal CustomUserDetails user,
                                                        @RequestParam(required = false) String title) {
        return ResponseEntity.ok(gameService.getGames(title, user));
    }

    // 좋아요 누르기 & 삭제
    @PostMapping("/{gameId}/like")
    public ResponseEntity<GameResponseDto> likeGame(@PathVariable Long gameId,
                                                    @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(gameService.toggleLike(gameId, user));
    }

    // 내가 좋아요 누른 게임 목록
    @GetMapping("/likes/me")
    public ResponseEntity<GameListResponseDto> getLikedGames(@AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(gameService.getLikedGames(user));
    }

}
