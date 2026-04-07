package growth._OK.backend.analysis.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class AnalysisDetailResponseDto {
    private final int totalAttempts;
    private final int totalWrongCount;
    private final int wrongRate;
    private final int avgResponseTimeMs;
    private final int hintUseRate;
    private final List<ScopeInsightDto> scopeInsights;
}
