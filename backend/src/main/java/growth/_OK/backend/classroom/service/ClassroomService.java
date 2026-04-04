package growth._OK.backend.classroom.service;

import growth._OK.backend.auth.dto.response.GoogleOAuthTokenResponse;
import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.auth.oauth.GoogleOAuthTokenClient;
import growth._OK.backend.classroom.client.GoogleClassroomClient;
import growth._OK.backend.classroom.dto.response.ClassroomCourseRosterResponse;
import growth._OK.backend.classroom.dto.response.ClassroomGameShareResponse;
import growth._OK.backend.classroom.dto.response.ClassroomPersonResponse;
import growth._OK.backend.classroom.dto.response.ClassroomUsersResponse;
import growth._OK.backend.game.domain.Game;
import growth._OK.backend.game.repository.GameRepository;
import growth._OK.backend.global.config.AppProperties;
import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ClassroomService {

    private final UserRepository userRepository;
    private final GameRepository gameRepository;
    private final GoogleOAuthTokenClient googleOAuthTokenClient;
    private final GoogleClassroomClient googleClassroomClient;
    private final AppProperties appProperties;

    @Transactional
    public void linkGoogleClassroom(CustomUserDetails userDetails, String rawCode) {
        String code = URLDecoder.decode(rawCode, StandardCharsets.UTF_8);
        User user = findUser(userDetails);
        GoogleOAuthTokenResponse token = googleOAuthTokenClient.exchangeAuthorizationCodeForClassroom(code);
        if (token == null || token.getAccess_token() == null || token.getAccess_token().isBlank()) {
            throw new CapstonException(ExceptionCode.GOOGLE_TOKEN_EXCHANGE_FAILED);
        }
        if (token.getScope() == null || !token.getScope().contains("classroom")) {
            throw new CapstonException(ExceptionCode.CLASSROOM_SCOPE_MISSING);
        }
        if (token.getRefresh_token() != null && !token.getRefresh_token().isBlank()) {
            user.setGoogleClassroomRefreshToken(token.getRefresh_token());
        } else if (user.getGoogleClassroomRefreshToken() == null
                || user.getGoogleClassroomRefreshToken().isBlank()) {
            throw new CapstonException(ExceptionCode.CLASSROOM_REFRESH_TOKEN_MISSING);
        }
    }

    @Transactional(readOnly = true)
    public ClassroomUsersResponse listClassroomUsers(CustomUserDetails userDetails) {
        User user = findUser(userDetails);
        String accessToken = accessTokenForClassroom(user);

        List<ClassroomCourseRosterResponse> coursesOut = new ArrayList<>();
        String coursesPageToken = null;
        do {
            GoogleClassroomClient.CoursesListResponse page =
                    googleClassroomClient.listTeacherCourses(accessToken, coursesPageToken);
            List<GoogleClassroomClient.CoursesListResponse.CourseItem> courses =
                    page.getCourses() != null ? page.getCourses() : List.of();
            for (GoogleClassroomClient.CoursesListResponse.CourseItem c : courses) {
                if (c.getId() == null) {
                    continue;
                }
                List<ClassroomPersonResponse> teachers = mapTeachers(allTeachers(accessToken, c.getId()));
                List<ClassroomPersonResponse> students = mapStudents(allStudents(accessToken, c.getId()));
                String name = c.getName() != null ? c.getName() : "";
                coursesOut.add(new ClassroomCourseRosterResponse(c.getId(), name, teachers, students));
            }
            coursesPageToken = page.getNextPageToken();
        } while (coursesPageToken != null && !coursesPageToken.isBlank());

        return new ClassroomUsersResponse(coursesOut);
    }

    @Transactional(readOnly = true)
    public ClassroomGameShareResponse shareGameToCourse(CustomUserDetails userDetails, Long gameId,
                                                          String courseId) {
        User user = findUser(userDetails);
        Game game = gameRepository.findById(gameId)
                .orElseThrow(() -> new CapstonException(ExceptionCode.GAME_NOT_FOUND));
        if (!game.getOwner().getUserId().equals(user.getUserId())) {
            throw new CapstonException(ExceptionCode.GAME_NOT_FOUND);
        }

        String accessToken = accessTokenForClassroom(user);
        String base = appProperties.getFrontendBaseUrl().replaceAll("/$", "");
        String gameUrl = base + "/games/" + gameId;
        String description = buildShareDescription(game, gameUrl);

        GoogleClassroomClient.CourseWorkCreateRequest request = new GoogleClassroomClient.CourseWorkCreateRequest();
        request.setTitle("[게임] " + game.getTitle());
        request.setDescription(description);

        GoogleClassroomClient.CourseWorkResponse created =
                googleClassroomClient.createCourseWork(accessToken, courseId, request);
        return new ClassroomGameShareResponse(created.getId(), courseId, created.getAlternateLink());
    }

    private static String buildShareDescription(Game game, String gameUrl) {
        StringBuilder sb = new StringBuilder();
        if (game.getDescription() != null && !game.getDescription().isBlank()) {
            sb.append(game.getDescription().trim()).append("\n\n");
        }
        sb.append("게임 링크: ").append(gameUrl);
        return sb.toString();
    }

    private List<GoogleClassroomClient.StudentItem> allStudents(String accessToken, String courseId) {
        List<GoogleClassroomClient.StudentItem> list = new ArrayList<>();
        String pageToken = null;
        do {
            GoogleClassroomClient.RosterPage page =
                    googleClassroomClient.listStudentsPage(accessToken, courseId, pageToken);
            list.addAll(page.students());
            pageToken = page.nextPageToken();
        } while (pageToken != null && !pageToken.isBlank());
        return list;
    }

    private List<GoogleClassroomClient.TeacherItem> allTeachers(String accessToken, String courseId) {
        List<GoogleClassroomClient.TeacherItem> list = new ArrayList<>();
        String pageToken = null;
        do {
            GoogleClassroomClient.RosterTeachersPage page =
                    googleClassroomClient.listTeachersPage(accessToken, courseId, pageToken);
            list.addAll(page.teachers());
            pageToken = page.nextPageToken();
        } while (pageToken != null && !pageToken.isBlank());
        return list;
    }

    private static List<ClassroomPersonResponse> mapStudents(List<GoogleClassroomClient.StudentItem> items) {
        return items.stream().map(ClassroomService::mapStudent).toList();
    }

    private static List<ClassroomPersonResponse> mapTeachers(List<GoogleClassroomClient.TeacherItem> items) {
        return items.stream().map(ClassroomService::mapTeacher).toList();
    }

    private static ClassroomPersonResponse mapStudent(GoogleClassroomClient.StudentItem s) {
        if (s == null) {
            return new ClassroomPersonResponse(null, null, null);
        }
        String fullName = null;
        String email = null;
        if (s.getProfile() != null) {
            email = s.getProfile().getEmailAddress();
            if (s.getProfile().getName() != null) {
                fullName = s.getProfile().getName().getFullName();
            }
        }
        return new ClassroomPersonResponse(s.getUserId(), fullName, email);
    }

    private static ClassroomPersonResponse mapTeacher(GoogleClassroomClient.TeacherItem t) {
        if (t == null) {
            return new ClassroomPersonResponse(null, null, null);
        }
        String fullName = null;
        String email = null;
        if (t.getProfile() != null) {
            email = t.getProfile().getEmailAddress();
            if (t.getProfile().getName() != null) {
                fullName = t.getProfile().getName().getFullName();
            }
        }
        return new ClassroomPersonResponse(t.getUserId(), fullName, email);
    }

    private String accessTokenForClassroom(User user) {
        String refresh = user.getGoogleClassroomRefreshToken();
        if (refresh == null || refresh.isBlank()) {
            throw new CapstonException(ExceptionCode.CLASSROOM_NOT_LINKED);
        }
        GoogleOAuthTokenResponse refreshed = googleOAuthTokenClient.refreshAccessToken(refresh);
        if (refreshed == null || refreshed.getAccess_token() == null || refreshed.getAccess_token().isBlank()) {
            throw new CapstonException(ExceptionCode.GOOGLE_TOKEN_EXCHANGE_FAILED);
        }
        return refreshed.getAccess_token();
    }

    private User findUser(CustomUserDetails userDetails) {
        return userRepository.findById(userDetails.getUser().getUserId())
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));
    }
}
