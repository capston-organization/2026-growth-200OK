package growth._OK.backend.game.dto.requestDto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class SubmitAnswerRequestDto {
    private final Boolean correct;

    @JsonCreator
    public SubmitAnswerRequestDto(@JsonProperty("correct") Boolean correct) {
        this.correct = correct;
    }
}
