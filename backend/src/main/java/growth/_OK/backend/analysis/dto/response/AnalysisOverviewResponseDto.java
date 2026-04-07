package growth._OK.backend.analysis.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class AnalysisOverviewResponseDto {
    private final List<String> weakTop3;
    private final List<CategoryScopeWrongRateDto> scopeWrongRates;
}
