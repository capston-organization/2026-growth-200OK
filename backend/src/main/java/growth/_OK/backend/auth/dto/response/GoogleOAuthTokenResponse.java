package growth._OK.backend.auth.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class GoogleOAuthTokenResponse {
    private String access_token;
    private String refresh_token;
    private String token_type;
    private String scope;
    private Integer expires_in;
}
