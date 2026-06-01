package growth._OK.backend.analysis.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CreateReviewGameResponseDto {
    private final Long gameId;
    private final String status;
    private final String nextPage;
}
