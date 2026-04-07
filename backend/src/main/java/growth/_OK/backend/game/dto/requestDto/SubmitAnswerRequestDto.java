package growth._OK.backend.game.dto.requestDto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SubmitAnswerRequestDto {
    private final Boolean correct;
    private final Integer responseTimeMs;
    private final Boolean hintUsed;
    private final Boolean explanationOpened;
    private final String chosenAnswer;
    private final String submittedText;

    @JsonCreator
    public SubmitAnswerRequestDto(
            @JsonProperty("correct") Boolean correct,
            @JsonProperty("responseTimeMs") Integer responseTimeMs,
            @JsonProperty("hintUsed") Boolean hintUsed,
            @JsonProperty("explanationOpened") Boolean explanationOpened,
            @JsonProperty("chosenAnswer") String chosenAnswer,
            @JsonProperty("submittedText") String submittedText
    ) {
        this.correct = correct;
        this.responseTimeMs = responseTimeMs;
        this.hintUsed = hintUsed;
        this.explanationOpened = explanationOpened;
        this.chosenAnswer = chosenAnswer;
        this.submittedText = submittedText;
    }
}
