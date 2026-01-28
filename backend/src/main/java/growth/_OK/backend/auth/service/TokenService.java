package growth._OK.backend.auth.service;

import growth._OK.backend.auth.dto.response.TokenResponse;
import growth._OK.backend.auth.jwt.JwtTokenProvider;
import growth._OK.backend.user.domain.User;
import jakarta.servlet.http.Cookie;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class TokenService {

    private final JwtTokenProvider jwtTokenProvider;
    private final RedisTemplate<String, String> redisTemplate;
    private static final String REFRESH_PREFIX = "RT";
    private static final String BLACKLIST_PREFIX = "blacklist:";
    private static final long REFRESH_EXPIRE = 1000L * 60 * 60 * 24 * 14;


    public TokenResponse generateTokens(User user) {

        String access = jwtTokenProvider.createAccessToken(user);
        String refresh = jwtTokenProvider.createRefreshToken(user);
        saveRefreshToken(user.getUserId().toString(), refresh);
        log.info("새 토큰 발급 userId={}, access={}, refresh={}",
                user.getUserId(), maskToken(access), maskToken(refresh));
        return new TokenResponse("Bearer", access, refresh, "3600", "1209600");
    }

    private void saveRefreshToken(String userId, String token) {
        redisTemplate.opsForValue()
                .set(REFRESH_PREFIX + userId, token, REFRESH_EXPIRE, TimeUnit.MILLISECONDS);
    }

    public boolean existsRefreshToken(String userId, String refreshToken) {
        String stored = redisTemplate.opsForValue()
                .get(REFRESH_PREFIX + userId);
        return stored != null && stored.equals(refreshToken);
    }

    public Cookie createRefreshCookie(String token) {
        Cookie cookie = new Cookie("refresh_token", token);
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge((int) (REFRESH_EXPIRE / 1000));
        return cookie;
    }

    public void deleteRefreshToken(String userId){
        redisTemplate.delete(REFRESH_PREFIX + userId);
    }

    public void registerBlackList(String accessToken, long expiration){
        log.info("Registering token in blacklist: {} with TTL: {}ms", accessToken, expiration);
        redisTemplate.opsForValue()
                .set(BLACKLIST_PREFIX + accessToken, "logout", expiration, TimeUnit.MILLISECONDS);
    }

    public boolean isBlacklisted(String accessToken) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(BLACKLIST_PREFIX + accessToken));
    }

    private String maskToken(String token) {
        if (token == null || token.length() < 10) return "*****";
        return token.substring(0, 5) + "..." + token.substring(token.length() - 5);
    }
}

