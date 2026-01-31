package growth._OK.backend.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Getter;
import lombok.ToString;

@Getter
@ToString
public class GoogleUserInfoResponse {
    /**
     * Google OpenID Connect user info response
     * ref: https://openid.net/specs/openid-connect-core-1_0.html#UserInfo
     */
    @JsonProperty("sub")
    private String id;

    private String email;

    @JsonProperty("name")
    private String name;

    @JsonProperty("picture")
    private String picture;
}
