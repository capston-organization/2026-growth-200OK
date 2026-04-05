package growth._OK.backend.auth.oauth;

import growth._OK.backend.auth.dto.response.GoogleOAuthTokenResponse;
import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

@Slf4j
@Component
@RequiredArgsConstructor
public class GoogleOAuthTokenClient {

    @Qualifier("googleProperties")
    private final OauthProperties oauthProperties;
    private final RestClient restClient;

    public GoogleOAuthTokenResponse exchangeAuthorizationCodeForClassroom(String code) {
        MultiValueMap<String, String> body =
                oauthProperties.createTokenRequestBody(code, oauthProperties.resolveClassroomRedirectUri());
        return postToken(body);
    }

    public GoogleOAuthTokenResponse refreshAccessToken(String refreshToken) {
        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "refresh_token");
        map.add("refresh_token", refreshToken);
        map.add("client_id", oauthProperties.getClientId());
        map.add("client_secret", oauthProperties.getClientSecret());
        return postToken(map);
    }

    private GoogleOAuthTokenResponse postToken(MultiValueMap<String, String> body) {
        try {
            return restClient.post()
                    .uri(oauthProperties.getTokenUri())
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(body)
                    .retrieve()
                    .body(GoogleOAuthTokenResponse.class);
        } catch (RestClientResponseException e) {
            log.warn("Google OAuth token endpoint: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new CapstonException(ExceptionCode.GOOGLE_TOKEN_EXCHANGE_FAILED);
        }
    }
}
