package growth._OK.backend.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "nlp")
public class NlpProperties {

    private String serverUrl = "http://localhost:8000";
    private int timeoutSeconds = 60;
    private boolean enabled = true;  // false 로 설정하면 Gemini 직접 호출로 fallback
}
