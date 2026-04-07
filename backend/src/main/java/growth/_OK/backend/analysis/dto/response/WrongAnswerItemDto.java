package growth._OK.backend.analysis.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
@AllArgsConstructor
public class WrongAnswerItemDto {
    private final Long gameId;
    private final Long problemId;
    private final String category; // WORD | GRAMMAR
    private final String scope;
    private final String question;
    private final String answer;
    private final LocalDate wrongDate;
}
