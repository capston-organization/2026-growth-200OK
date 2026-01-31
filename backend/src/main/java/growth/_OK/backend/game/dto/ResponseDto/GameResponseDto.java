package growth._OK.backend.game.dto.ResponseDto;

import growth._OK.backend.game.domain.Game;
import growth._OK.backend.game.domain.GameType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class GameResponseDto {
    private final Long id;
    private final Long ownerId;
    private final GameType type;
    private final String title;
    private final String description;
    private final boolean liked;
    private final boolean isPublic;

    public static GameResponseDto from(Game game) {
        return GameResponseDto.builder()
                .id(game.getId())
                .ownerId(game.getOwner().getUserId())
                .type(game.getType())
                .title(game.getTitle())
                .description(game.getDescription())
                .liked(false)
                .isPublic(game.isPublic())
                .build();
    }

    public static GameResponseDto from(Game game, boolean liked) {
        return GameResponseDto.builder()
                .id(game.getId())
                .ownerId(game.getOwner().getUserId())
                .type(game.getType())
                .title(game.getTitle())
                .description(game.getDescription())
                .liked(liked)
                .isPublic(game.isPublic())
                .build();
    }
}
