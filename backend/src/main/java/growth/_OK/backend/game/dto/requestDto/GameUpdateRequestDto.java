package growth._OK.backend.game.dto.requestDto;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GameUpdateRequestDto {
    private String title;
    private String description;
    @JsonAlias("public")
    private Boolean isPublic;
}
