package growth._OK.backend.auth.oauth;

import lombok.Getter;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

@Getter
public class OauthProperties {

    private final String tokenUri;
    private final String userInfoUri;
    private final String redirectUri;
    private final String classroomRedirectUri;
    private final String clientId;
    private final String clientSecret;

    public OauthProperties(String tokenUri, String userInfoUri, String redirectUri,
                           String classroomRedirectUri,
                           String clientId, String clientSecret) {
        this.tokenUri = tokenUri;
        this.userInfoUri = userInfoUri;
        this.redirectUri = redirectUri;
        this.classroomRedirectUri = classroomRedirectUri != null ? classroomRedirectUri : "";
        this.clientId = clientId;
        this.clientSecret = clientSecret;
    }

    public String resolveClassroomRedirectUri() {
        if (classroomRedirectUri != null && !classroomRedirectUri.isBlank()) {
            return classroomRedirectUri;
        }
        return redirectUri;
    }

    public MultiValueMap<String, String> createTokenRequestBody(String code) {
        return createTokenRequestBody(code, redirectUri);
    }

    public MultiValueMap<String, String> createTokenRequestBody(String code, String redirectUriToUse) {
        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("grant_type", "authorization_code");
        map.add("code", code);
        map.add("redirect_uri", redirectUriToUse);
        map.add("client_id", clientId);
        map.add("client_secret", clientSecret);
        return map;
    }
}
