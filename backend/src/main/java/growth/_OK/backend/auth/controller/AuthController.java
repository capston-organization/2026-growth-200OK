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

    @PostMapping("/google")
    public ResponseEntity<Void> loginOrRegister(@RequestBody GoogleCodeRequest request, HttpServletResponse response) {
        authService.googleLogin(request, response);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<Void> refresh(
            @CookieValue("refresh_token") String refreshToken,
            HttpServletResponse response) {
        TokenResponse tokens = authService.reissue(refreshToken);
        response.setHeader("Authorization", "Bearer " + tokens.getAccess_token());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal CustomUserDetails user,
                                       HttpServletResponse response,
                                       @RequestHeader("Authorization") String accessToken) {
        authService.logout(user, accessToken, response);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal CustomUserDetails user,
                                              @RequestHeader("Authorization") String accessToken,
                                              HttpServletResponse response) {
        authService.deleteAccount(user, accessToken, response);
        return ResponseEntity.noContent().build();
    }

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
}
