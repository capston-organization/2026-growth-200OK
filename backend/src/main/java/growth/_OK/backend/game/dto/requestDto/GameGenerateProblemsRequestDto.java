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
    /** 생성할 문제 개수. null이면 게임 기본값 사용 */
    private final Integer problemCount;
    /** 사용할 문제 유형. null이면 게임 허용 유형 전체 */
    private final List<ProblemType> problemTypes;
}
