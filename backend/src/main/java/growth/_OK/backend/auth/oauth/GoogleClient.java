package growth._OK.backend.auth.oauth;

import growth._OK.backend.auth.dto.response.GoogleUserInfoResponse;
import growth._OK.backend.auth.dto.response.TokenResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component("googleClient")
@RequiredArgsConstructor
public class GoogleClient {

    @Qualifier("googleProperties")
    private final OauthProperties oauthProperties;

    private final RestClient restClient;

    public GoogleUserInfoResponse requestUserInfo(String code) {
        TokenResponse response = requestToken(code);

        return restClient.get()
                .uri(oauthProperties.getUserInfoUri())
                .header("Authorization", "Bearer " + response.getAccess_token())
                .retrieve()
                .body(GoogleUserInfoResponse.class);
    }

    private TokenResponse requestToken(String code) {
        MultiValueMap<String, String> tokenRequestBody = oauthProperties.createTokenRequestBody(code);

        return restClient.post()
                .uri(oauthProperties.getTokenUri())
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(tokenRequestBody)
                .retrieve()
                .body(TokenResponse.class);
    }
}
