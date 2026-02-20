package growth._OK.backend.auth.controller;

import growth._OK.backend.auth.dto.request.GoogleCodeRequest;
import growth._OK.backend.auth.dto.response.TokenResponse;
import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.auth.service.AuthService;
import growth._OK.backend.user.dto.request.UserBasicInfoRequestDto;
import growth._OK.backend.user.dto.response.UserBasicInfoResponseDto;
import growth._OK.backend.user.service.UserService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

@Controller
@RequiredArgsConstructor
@RequestMapping("/auth")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;

    // 로그인
    @PostMapping("/google")
    public ResponseEntity<Void> loginOrRegister(@RequestBody GoogleCodeRequest request, HttpServletResponse response) {
        authService.googleLogin(request, response);
        return ResponseEntity.ok().build();
    }

    // 리이슈
    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(
            @CookieValue("refresh_token") String refreshToken,
            HttpServletResponse response) {
        TokenResponse tokens = authService.reissue(refreshToken);
        response.setHeader("Authorization", "Bearer " + tokens.getAccess_token());
        return ResponseEntity.ok().build();
    }

    // 로그아웃
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal CustomUserDetails user,
                                       HttpServletResponse response,
                                       @RequestHeader("Authorization") String accessToken) {
        authService.logout(user, accessToken, response);
        return ResponseEntity.ok().build();
    }

    // 계정 삭제
    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal CustomUserDetails user,
                                              @RequestHeader("Authorization") String accessToken,
                                              HttpServletResponse response) {
        authService.deleteAccount(user, accessToken, response);
        return ResponseEntity.noContent().build();
    }

    // 기본 정보 조회
    @GetMapping("/me")
    public ResponseEntity<UserBasicInfoResponseDto> getMyBasicInfo(
            @AuthenticationPrincipal CustomUserDetails user) {
        UserBasicInfoResponseDto dto = userService.getBasicInfo(user.getUser().getUserId());
        return ResponseEntity.ok(dto);
    }

    // 기본 정보 수정
    @PatchMapping("/me")
    public ResponseEntity<UserBasicInfoResponseDto> updateMyBasicInfo(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody UserBasicInfoRequestDto request) {
        UserBasicInfoResponseDto dto = userService.updateBasicInfo(
                user.getUser().getUserId(), request);
        return ResponseEntity.ok(dto);
    }
}
