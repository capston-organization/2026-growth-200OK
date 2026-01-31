package growth._OK.backend.auth.jwt;

import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import growth._OK.backend.user.domain.User;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;


@Component
public class JwtTokenProvider {

    private final String secretKey;
    private final long ACCESS_EXPIRE = 1000L * 60 * 60; // 1시간
    private final long REFRESH_EXPIRE = 1000L * 60 * 60 * 24 * 14; // 2주

    public JwtTokenProvider(@Value("${jwt.secret}") String secretKey) {
        this.secretKey = secretKey;
    }

    public SecretKey getSecretKey() {return Keys.hmacShaKeyFor(secretKey.getBytes());}

    // 토큰 생성
    public String createAccessToken(User user) {return createToken(user, ACCESS_EXPIRE, "access");}
    public String createRefreshToken(User user) {return createToken(user, REFRESH_EXPIRE, "refresh");}

    private String createToken(User user, long expiration, String tokenType) {
        Date now = new Date();
        Date expirationDate = new Date(now.getTime() + expiration);

        return Jwts.builder()
                .setSubject(user.getUserId().toString())
                .setIssuedAt(now)
                .setExpiration(expirationDate)
                .claim("type", tokenType)
                .signWith(getSecretKey())
                .compact();
    }

    // 토큰 검증
    public boolean validateToken(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(getSecretKey())
                    .build()
                    .parseClaimsJws(token);
            return true;

        } catch (JwtException | IllegalArgumentException e) {
            System.out.println("JWT ERROR = " + e.getMessage());
            return false;
        }
    }

    // 공통 Claims 파싱
    private Claims parseClaims(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSecretKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

        } catch (ExpiredJwtException e) {
            throw new CapstonException(ExceptionCode.AUTH_TOKEN_EXPIRED);
        } catch (JwtException e) {
            throw new CapstonException(ExceptionCode.AUTH_TOKEN_INVALID);
        }
    }

    // 토큰 타입 확인
    public boolean isRefreshToken(String token) {
        Claims claims = parseClaims(token);
        return "refresh".equals(claims.get("type", String.class));
    }

    // AccessToken  userId 추출
    public Long getUserIdFromAccessToken(String token) {
        Claims claims = parseClaims(token);
        if (!"access".equals(claims.get("type", String.class))) {
            throw new CapstonException(ExceptionCode.AUTH_TOKEN_MISMATCH);
        }
        return Long.valueOf(claims.getSubject());
    }

    // RefreshToken userId 추출
    public Long getUserIdFromRefreshToken(String token) {
        Claims claims = parseClaims(token);
        if (!"refresh".equals(claims.get("type", String.class))) {
            throw new CapstonException(ExceptionCode.AUTH_TOKEN_MISMATCH);
        }

        return Long.valueOf(claims.getSubject());
    }

    /**
     * AccessToken의 남은 만료 시간을 밀리초로 반환.
     * 만료된 토큰이면 0을 반환하여 블랙리스트 TTL로 사용.
     */
    public long getRemainingTime(String token) {
        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(getSecretKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
            long diff = claims.getExpiration().getTime() - System.currentTimeMillis();
            return Math.max(diff, 0);
        } catch (ExpiredJwtException e) {
            // 이미 만료된 토큰인 경우 TTL 0
            return 0;
        } catch (JwtException e) {
            throw new CapstonException(ExceptionCode.AUTH_TOKEN_INVALID);
        }
    }

}
