package growth._OK.backend.user.controller;

import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.user.dto.request.UserBasicInfoRequestDto;
import growth._OK.backend.user.dto.response.StreakResponseDto;
import growth._OK.backend.user.dto.response.UserBasicInfoResponseDto;
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

    @GetMapping("/me")
    public ResponseEntity<UserBasicInfoResponseDto> getMyBasicInfo(
            @AuthenticationPrincipal CustomUserDetails user) {
        UserBasicInfoResponseDto dto = userService.getBasicInfo(user.getUser().getUserId());
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

    // 스트릭 조회: 기간 내 날짜별 플레이 여부(채움/빈칸) + 현재 연속 스트릭 일수.
    // 오늘 플레이했으면 스트릭 유지, 안 했으면 빈칸 / currentStreak 0.
    // @param days 조회 일수 (기본 30, 최대 365)
    @GetMapping("/me/streak")
    public ResponseEntity<StreakResponseDto> getMyStreak(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) Integer days) {
        StreakResponseDto dto = userStreakService.getStreakData(user.getUser().getUserId(), days);
        return ResponseEntity.ok(dto);
    }
}
