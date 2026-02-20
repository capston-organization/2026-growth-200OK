package growth._OK.backend.game.dto.ResponseDto;

import growth._OK.backend.game.domain.Game;
import growth._OK.backend.game.domain.GameType;
import growth._OK.backend.game.domain.ProblemType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class GameResponseDto {
    private final Long id;
    private final Long ownerId;
    private final GameType type;
    private final String title;
    private final String description;
    private final String learningObjectives;
    private final int likeCount;
    private final boolean isLiked;
    private final boolean isPublic;
    private final int problemCount;
    private final List<ProblemType> problemTypes;

    public static GameResponseDto from(Game game) {
        return GameResponseDto.builder()
                .id(game.getId())
                .ownerId(game.getOwner().getUserId())
                .type(game.getType())
                .title(game.getTitle())
                .description(game.getDescription())
                .learningObjectives(game.getLearningObjectives())
                .likeCount(game.getLikeCount())
                .isLiked(false)
                .isPublic(game.isPublic())
                .problemCount(game.getProblemCount())
                .problemTypes(game.getAllowedProblemTypes() != null ? List.copyOf(game.getAllowedProblemTypes()) : List.of())
                .build();
    }

    public static GameResponseDto from(Game game, boolean isLiked) {
        return GameResponseDto.builder()
                .id(game.getId())
                .ownerId(game.getOwner().getUserId())
                .type(game.getType())
                .title(game.getTitle())
                .description(game.getDescription())
                .learningObjectives(game.getLearningObjectives())
                .likeCount(game.getLikeCount())
                .isLiked(isLiked)
                .isPublic(game.isPublic())
                .problemCount(game.getProblemCount())
                .problemTypes(game.getAllowedProblemTypes() != null ? List.copyOf(game.getAllowedProblemTypes()) : List.of())
                .build();
    }
}
