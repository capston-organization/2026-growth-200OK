package growth._OK.backend.classroom.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.util.Collections;
import java.util.List;

@Slf4j
@Component
public class GoogleClassroomClient {

    private static final String BASE = "https://classroom.googleapis.com/v1";

    private final RestClient restClient;

    public GoogleClassroomClient(RestClient restClient) {
        this.restClient = restClient;
    }

    public CoursesListResponse listTeacherCourses(String accessToken, String pageToken) {
        UriComponentsBuilder b = UriComponentsBuilder.fromUriString(BASE + "/courses")
                .queryParam("courseStates", "ACTIVE")
                .queryParam("teacherId", "me")
                .queryParam("pageSize", 100);
        if (pageToken != null && !pageToken.isBlank()) {
            b.queryParam("pageToken", pageToken);
        }
        URI uri = b.build().toUri();
        try {
            CoursesListResponse body = restClient.get()
                    .uri(uri)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(CoursesListResponse.class);
            return body != null ? body : new CoursesListResponse();
        } catch (RestClientResponseException e) {
            log.warn("Classroom list courses failed: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new CapstonException(ExceptionCode.CLASSROOM_API_ERROR);
        }
    }

    public RosterPage listStudentsPage(String accessToken, String courseId, String pageToken) {
        UriComponentsBuilder b = UriComponentsBuilder
                .fromUriString(BASE + "/courses/{courseId}/students")
                .queryParam("pageSize", 100);
        if (pageToken != null && !pageToken.isBlank()) {
            b.queryParam("pageToken", pageToken);
        }
        URI uri = b.buildAndExpand(courseId).toUri();
        try {
            StudentsListResponse body = restClient.get()
                    .uri(uri)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(StudentsListResponse.class);
            return new RosterPage(
                    body != null && body.getStudents() != null ? body.getStudents() : Collections.emptyList(),
                    body != null ? body.getNextPageToken() : null
            );
        } catch (RestClientResponseException e) {
            log.warn("Classroom list students failed: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new CapstonException(ExceptionCode.CLASSROOM_API_ERROR);
        }
    }

    public RosterTeachersPage listTeachersPage(String accessToken, String courseId, String pageToken) {
        UriComponentsBuilder b = UriComponentsBuilder
                .fromUriString(BASE + "/courses/{courseId}/teachers")
                .queryParam("pageSize", 100);
        if (pageToken != null && !pageToken.isBlank()) {
            b.queryParam("pageToken", pageToken);
        }
        URI uri = b.buildAndExpand(courseId).toUri();
        try {
            TeachersListResponse body = restClient.get()
                    .uri(uri)
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(TeachersListResponse.class);
            return new RosterTeachersPage(
                    body != null && body.getTeachers() != null ? body.getTeachers() : Collections.emptyList(),
                    body != null ? body.getNextPageToken() : null
            );
        } catch (RestClientResponseException e) {
            log.warn("Classroom list teachers failed: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new CapstonException(ExceptionCode.CLASSROOM_API_ERROR);
        }
    }

    public CourseWorkResponse createCourseWork(String accessToken, String courseId, CourseWorkCreateRequest request) {
        URI uri = UriComponentsBuilder.fromUriString(BASE + "/courses/{courseId}/courseWork")
                .buildAndExpand(courseId)
                .toUri();
        try {
            CourseWorkResponse created = restClient.post()
                    .uri(uri)
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(CourseWorkResponse.class);
            if (created == null) {
                throw new CapstonException(ExceptionCode.CLASSROOM_API_ERROR);
            }
            return created;
        } catch (RestClientResponseException e) {
            log.warn("Classroom create courseWork failed: {} {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new CapstonException(ExceptionCode.CLASSROOM_API_ERROR);
        }
    }

    public record RosterPage(List<StudentItem> students, String nextPageToken) {}

    public record RosterTeachersPage(List<TeacherItem> teachers, String nextPageToken) {}

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CoursesListResponse {
        private List<CourseItem> courses;
        private String nextPageToken;

        @Getter
        @Setter
        @NoArgsConstructor
        @JsonIgnoreProperties(ignoreUnknown = true)
        public static class CourseItem {
            private String id;
            private String name;
        }
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class StudentsListResponse {
        private List<StudentItem> students;
        private String nextPageToken;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TeachersListResponse {
        private List<TeacherItem> teachers;
        private String nextPageToken;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class StudentItem {
        private String userId;
        private Profile profile;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TeacherItem {
        private String userId;
        private Profile profile;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Profile {
        private Name name;
        private String emailAddress;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Name {
        private String fullName;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CourseWorkCreateRequest {
        private String title;
        private String description;
        private String workType = "ASSIGNMENT";
        private String state = "PUBLISHED";
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class CourseWorkResponse {
        private String id;
        private String alternateLink;
    }
}
