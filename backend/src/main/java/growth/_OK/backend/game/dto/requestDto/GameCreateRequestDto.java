package growth._OK.backend.game.dto.requestDto;

import growth._OK.backend.game.domain.GameType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GameCreateRequestDto {
    private final GameType type;
    private final String title;
    private final String description;
    private final Boolean isPublic;
}
