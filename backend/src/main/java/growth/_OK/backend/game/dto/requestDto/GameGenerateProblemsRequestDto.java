package growth._OK.backend.game.dto.requestDto;

import growth._OK.backend.game.domain.ProblemType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GameGenerateProblemsRequestDto {
    private final Integer problemCount;
    private final List<ProblemType> problemTypes;
}
