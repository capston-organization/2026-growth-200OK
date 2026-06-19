package growth._OK.backend.analysis.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ScopeWrongRateDto {
    private final String scope;
    private final int wrongRate;
}
