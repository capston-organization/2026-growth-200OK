package growth._OK.backend.auth.service;

import growth._OK.backend.auth.dto.request.GoogleCodeRequest;
import growth._OK.backend.auth.dto.response.GoogleUserInfoResponse;
import growth._OK.backend.auth.dto.response.LoginResponseDto;
import growth._OK.backend.auth.dto.response.TokenResponse;
import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.auth.jwt.JwtTokenProvider;
import growth._OK.backend.auth.oauth.GoogleClient;
import growth._OK.backend.auth.util.CookieUtil;
import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import growth._OK.backend.user.domain.Provider;
import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final TokenService tokenService;
    private final GoogleClient googleClient;

    @Transactional
    public LoginResponseDto googleLogin(GoogleCodeRequest request, HttpServletResponse response) {

        String decodedCode = java.net.URLDecoder.decode(request.getCode(), java.nio.charset.StandardCharsets.UTF_8);

        GoogleUserInfoResponse googleInfo = googleClient.requestUserInfo(decodedCode);
        String providerId = googleInfo.getId();

        User user = userRepository.findByProviderId(providerId)
                .orElseGet(() -> registerUser(providerId, googleInfo));
        log.info("로그인: {}", user.getName());

        TokenResponse tokens = tokenService.generateTokens(user);

        response.addCookie(tokenService.createRefreshCookie(tokens.getRefresh_token()));
        response.setHeader("Authorization", "Bearer " + tokens.getAccess_token());
        return LoginResponseDto.from(user);
    }

    @Transactional
    private User registerUser(String providerId, GoogleUserInfoResponse userInfoResponse) {

        String name = userInfoResponse.getName();
        String profileImage = userInfoResponse.getPicture();

        User user = User.fromGoogle(name, providerId, profileImage, Provider.GOOGLE);

        log.info("신규 회원가입: {}", name);
        return userRepository.save(user);
    }

    public TokenResponse reissue(String refreshToken) {
        Long userId = jwtTokenProvider.getUserIdFromRefreshToken(refreshToken);

        // redis에 저장된 refreshToken과 비교
        if (!tokenService.existsRefreshToken(userId.toString(), refreshToken)) {
            throw new CapstonException(ExceptionCode.AUTH_TOKEN_INVALID);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));

        String newAccessToken = jwtTokenProvider.createAccessToken(user);

        return new TokenResponse("Bearer", newAccessToken, null,"3600", "1209600" );
    }

    @Transactional
    public void logout(CustomUserDetails userDetails, String accessToken, HttpServletResponse response) {
        User user = findUser(userDetails);
        tokenService.deleteRefreshToken(user.getUserId().toString());
        String originAccessToken = accessToken.substring(7);
        long remainingTime = jwtTokenProvider.getRemainingTime(originAccessToken);
        tokenService.registerBlackList(originAccessToken, remainingTime);

        CookieUtil.deleteCookie(response, "refresh_token");
    }

    @Transactional(readOnly = true)
    private User findUser(CustomUserDetails userDetails){
        return userRepository.findById(userDetails.getUser().getUserId())
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));
    }

    @Transactional
    public void deleteAccount(CustomUserDetails userDetails, String accessToken, HttpServletResponse response) {
        User user = findUser(userDetails);

        tokenService.deleteRefreshToken(user.getUserId().toString());
        String originAccessToken = accessToken.substring(7);
        long remainingTime = jwtTokenProvider.getRemainingTime(originAccessToken);
        tokenService.registerBlackList(originAccessToken, remainingTime);
        CookieUtil.deleteCookie(response, "refresh_token");

        userRepository.delete(user);
    }

}
