package growth._OK.backend.auth.oauth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
public class OauthConfig {

    @Bean
    public RestClient restClient() {
        return RestClient.builder().build();
    }

    @Bean
    public OauthProperties googleProperties(
            @Value("${oauth.google.token-uri:https://oauth2.googleapis.com/token}") String tokenUri,
            @Value("${oauth.google.user-info-uri:https://www.googleapis.com/oauth2/v3/userinfo}") String userInfoUri,
            @Value("${oauth.google.redirect-uri:http://localhost:8080/auth/google}") String redirectUri,
            @Value("${oauth.google.classroom-redirect-uri:}") String classroomRedirectUri,
            @Value("${oauth.google.client-id:}") String clientId,
            @Value("${oauth.google.client-secret:}") String clientSecret
    ) {
        return new OauthProperties(tokenUri, userInfoUri, redirectUri, classroomRedirectUri, clientId, clientSecret);
    }
}
