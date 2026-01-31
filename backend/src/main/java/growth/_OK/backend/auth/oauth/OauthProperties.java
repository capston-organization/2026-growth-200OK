package growth._OK.backend.auth.oauth;

import lombok.Getter;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@Getter
public class OauthProperties {

    private final String tokenUri;
    private final String userInfoUri;
    private final String redirectUri;
    private final String clientId;
    private final String clientSecret;

    public OauthProperties(String tokenUri, String userInfoUri, String redirectUri,
                           String clientId, String clientSecret){
        this.tokenUri = tokenUri;
        this.userInfoUri = userInfoUri;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.redirectUri = redirectUri;
    }

    public MultiValueMap<String, String> createTokenRequestBody(String code){
        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "authorization_code");
        map.add("code", code);
        map.add("redirect_uri", redirectUri);
        map.add("client_id", clientId);
        map.add("client_secret", clientSecret);
        return map;
    }
}
