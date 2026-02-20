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
    /** 첫 시도 정답 여부. null이면 미제출 */
    private final Boolean firstAttemptCorrect;
    /** 해설 (없으면 빈 문자열 또는 Gemini로 생성 후 포함) */
    private final String explanation;
}
