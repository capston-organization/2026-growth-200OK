package growth._OK.backend.auth.jwt;

import growth._OK.backend.auth.service.TokenService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserDetailsService userDetailsService;
    private final TokenService tokenService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {
        System.out.println(">>> Filte enter");
        System.out.println(">>> Raw Authorization = " + request.getHeader("Authorization"));


        // 0. 로그인 관련 요청은 JWT 필터 제외
        String uri = request.getRequestURI();
        if (uri.startsWith("/auth/google")) {
            filterChain.doFilter(request, response);
            return;
        }

        String header = request.getHeader("Authorization");

        // 1. Authorization 헤더 없거나 형식 안 맞으면 안됨
        if (header == null || !header.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // 2. Bearer 없애기
        String token = header.substring(7);

        try { // 3. 토큰 유효성 검증 (서명, 만료 등 확인)
            // 유효하지 않거나 블랙리스트면 바로 401
            if (!jwtTokenProvider.validateToken(token) || tokenService.isBlacklisted(token)) {
                SecurityContextHolder.clearContext();
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or blacklisted token");
                return;
            }

            // 4. 토큰에서 userId 추출 ( 만약 리프레시 토큰이면 패스 )
            if (jwtTokenProvider.isRefreshToken(token)) {filterChain.doFilter(request, response); return;}
            Long userId = jwtTokenProvider.getUserIdFromAccessToken(token);

            // 5. 이미 인증해 있으면 또 인증X
            if (SecurityContextHolder.getContext().getAuthentication() == null) {

                CustomUserDetails userDetails =
                        (CustomUserDetails) userDetailsService.loadUserByUsername(userId.toString());

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails, null, userDetails.getAuthorities());

                authentication.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                );

                // 6. SecurityContext에 인증 정보 저장
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }

        } catch (Exception e) {
            System.out.println("JWT Filter Exception: " + e.getClass().getName());
            System.out.println("JWT Filter Exception Message: " + e.getMessage());
            e.printStackTrace();
            SecurityContextHolder.clearContext();
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
