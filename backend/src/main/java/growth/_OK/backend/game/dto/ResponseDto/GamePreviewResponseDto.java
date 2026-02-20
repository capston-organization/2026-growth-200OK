package growth._OK.backend.game.dto.ResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GamePreviewResponseDto {
    private final String description;
    private final String learningObjectives;
    private final String learningContent;
}
