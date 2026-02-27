package growth._OK.backend.game.dto.ResponseDto;

import growth._OK.backend.game.domain.ProblemType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class ProblemWithStatusDto {
    private final Long id;
    private final String question;
    private final List<String> options;
    private final String correctAnswer;
    private final ProblemType type;
    private final int sortOrder;
    private final Boolean firstAttemptCorrect;
    private final String explanation;
}
