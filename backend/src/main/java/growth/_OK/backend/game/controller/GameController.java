package growth._OK.backend.game.controller;

import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.game.dto.ResponseDto.GameListResponseDto;
import growth._OK.backend.game.dto.ResponseDto.GameResponseDto;
import growth._OK.backend.game.dto.requestDto.GameCreateRequestDto;
import growth._OK.backend.game.service.GameService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequestMapping("/api/games")
@RequiredArgsConstructor
public class GameController {

    private final GameService gameService;

    // 게임 생성 
    @PostMapping
    public ResponseEntity<GameResponseDto> createGame(@AuthenticationPrincipal CustomUserDetails user,
                                                      @RequestBody GameCreateRequestDto request) {
        GameResponseDto created = gameService.createGame(request, user);
        URI location = URI.create("/api/games/" + created.getId());
        return ResponseEntity.created(location).body(created);
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
