package growth._OK.backend.classroom.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class GameClassroomShareRequest {

    @NotBlank
    private String courseId;
}
