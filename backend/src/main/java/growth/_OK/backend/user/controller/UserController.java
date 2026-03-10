package growth._OK.backend.user.controller;

import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.game.dto.ResponseDto.GameListResponseDto;
import growth._OK.backend.game.service.GameService;
import growth._OK.backend.user.dto.request.UserBasicInfoRequestDto;
import growth._OK.backend.user.dto.response.CharacterStatusResponseDto;
import growth._OK.backend.user.dto.response.CoinBalanceResponseDto;
import growth._OK.backend.user.dto.response.StreakResponseDto;
import growth._OK.backend.user.dto.response.UserBasicInfoResponseDto;
import growth._OK.backend.user.dto.response.GreetingResponseDto;
import growth._OK.backend.user.service.UserCareService;
import growth._OK.backend.user.service.UserCoinService;
import growth._OK.backend.user.service.UserService;
import growth._OK.backend.user.service.UserStreakService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserStreakService userStreakService;
    private final UserCoinService userCoinService;
    private final UserCareService userCareService;
    private final GameService gameService;

    @GetMapping("/me")
    public ResponseEntity<UserBasicInfoResponseDto> getMyBasicInfo(
            @AuthenticationPrincipal CustomUserDetails user) {
        UserBasicInfoResponseDto dto = userService.getBasicInfo(user.getUser().getUserId());
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/me/coins")
    public ResponseEntity<CoinBalanceResponseDto> getMyCoins(
            @AuthenticationPrincipal CustomUserDetails user) {
        int coins = userCoinService.getCoins(user.getUser().getUserId());
        return ResponseEntity.ok(CoinBalanceResponseDto.builder().coins(coins).build());
    }

    @PostMapping("/me/actions/snack")
    public ResponseEntity<CharacterStatusResponseDto> giveSnack(
            @AuthenticationPrincipal CustomUserDetails user) {
        CharacterStatusResponseDto dto = userCareService.giveSnack(user.getUser().getUserId());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/me/actions/play")
    public ResponseEntity<CharacterStatusResponseDto> play(
            @AuthenticationPrincipal CustomUserDetails user) {
        CharacterStatusResponseDto dto = userCareService.play(user.getUser().getUserId());
        return ResponseEntity.ok(dto);
    }

    @PostMapping("/me/actions/study")
    public ResponseEntity<CharacterStatusResponseDto> study(
            @AuthenticationPrincipal CustomUserDetails user) {
        CharacterStatusResponseDto dto = userCareService.study(user.getUser().getUserId());
        return ResponseEntity.ok(dto);
    }

    @PatchMapping("/me")
    public ResponseEntity<UserBasicInfoResponseDto> updateMyBasicInfo(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody UserBasicInfoRequestDto request) {
        UserBasicInfoResponseDto dto = userService.updateBasicInfo(
                user.getUser().getUserId(), request);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/me/streak")
    public ResponseEntity<StreakResponseDto> getMyStreak(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) Integer days) {
        StreakResponseDto dto = userStreakService.getStreakData(user.getUser().getUserId(), days);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/me/games")
    public ResponseEntity<GameListResponseDto> getMyGames(@AuthenticationPrincipal CustomUserDetails user) {
        GameListResponseDto dto = gameService.getMyGames(user);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/me/games/recent")
    public ResponseEntity<GameListResponseDto> getMyRecentPlayedGames(@AuthenticationPrincipal CustomUserDetails user) {
        GameListResponseDto dto = gameService.getRecentPlayedGames(user, 5);
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/me/greeting")
    public ResponseEntity<GreetingResponseDto> getGreeting(
            @AuthenticationPrincipal CustomUserDetails user) {
        GreetingResponseDto dto = userService.getRandomGreeting();
        return ResponseEntity.ok(dto);
    }
}
