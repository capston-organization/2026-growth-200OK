package growth._OK.backend.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CharacterStatusResponseDto {
    private final int coins;
    private final int happiness;
    private final int fullness;
    private final int level;
}

