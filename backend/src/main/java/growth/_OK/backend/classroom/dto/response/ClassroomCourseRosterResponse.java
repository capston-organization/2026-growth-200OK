package growth._OK.backend.classroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class ClassroomCourseRosterResponse {
    private final String courseId;
    private final String courseName;
    private final List<ClassroomPersonResponse> teachers;
    private final List<ClassroomPersonResponse> students;
}
