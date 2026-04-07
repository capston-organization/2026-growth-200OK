package growth._OK.backend.analysis.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateReviewGameRequestDto {
    private String category; // WORD | GRAMMAR
    private String scope;
}
