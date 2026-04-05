package growth._OK.backend.classroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class ClassroomPersonResponse {
    private final String userId;
    private final String fullName;
    private final String email;
}
