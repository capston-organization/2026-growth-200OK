package growth._OK.backend.classroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ClassroomUsersResponse {
    private final List<ClassroomCourseRosterResponse> courses;
}
