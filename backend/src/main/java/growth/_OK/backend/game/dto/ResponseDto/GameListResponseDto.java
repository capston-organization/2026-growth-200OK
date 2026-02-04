package growth._OK.backend.game.dto.ResponseDto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GameListResponseDto {
    private final List<GameResponseDto> games;

    public static GameListResponseDto from(List<GameResponseDto> games) {
        return GameListResponseDto.builder()
                .games(games)
                .build();
    }
}
