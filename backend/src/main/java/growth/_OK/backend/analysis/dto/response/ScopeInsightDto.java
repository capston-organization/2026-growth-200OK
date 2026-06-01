package growth._OK.backend.analysis.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ScopeInsightDto {
    private final String category;
    private final String scope;
    private final int attemptCount;
    private final int wrongCount;
    private final int wrongRate;
}
