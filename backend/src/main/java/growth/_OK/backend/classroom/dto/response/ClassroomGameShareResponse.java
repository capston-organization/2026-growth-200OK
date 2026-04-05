package growth._OK.backend.classroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ClassroomGameShareResponse {
    private final String courseWorkId;
    private final String courseId;
    private final String alternateLink;
}
