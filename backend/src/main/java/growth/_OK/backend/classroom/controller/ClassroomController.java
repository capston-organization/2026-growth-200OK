package growth._OK.backend.classroom.controller;

import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.classroom.dto.request.ClassroomLinkRequest;
import growth._OK.backend.classroom.dto.request.GameClassroomShareRequest;
import growth._OK.backend.classroom.dto.response.ClassroomGameShareResponse;
import growth._OK.backend.classroom.dto.response.ClassroomUsersResponse;
import growth._OK.backend.classroom.service.ClassroomService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/classrooms")
@RequiredArgsConstructor
public class ClassroomController {

    private final ClassroomService classroomService;

    @PostMapping("/users")
    public ResponseEntity<Void> linkClassroom(@AuthenticationPrincipal CustomUserDetails user,
                                              @Valid @RequestBody ClassroomLinkRequest request) {
        classroomService.linkGoogleClassroom(user, request.getCode());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/users")
    public ResponseEntity<ClassroomUsersResponse> listClassroomUsers(
            @AuthenticationPrincipal CustomUserDetails user) {
        return ResponseEntity.ok(classroomService.listClassroomUsers(user));
    }

    @PostMapping("/game-share/{gameId}")
    public ResponseEntity<ClassroomGameShareResponse> shareGame(
            @AuthenticationPrincipal CustomUserDetails user,
            @PathVariable Long gameId,
            @Valid @RequestBody GameClassroomShareRequest request) {
        return ResponseEntity.ok(
                classroomService.shareGameToCourse(user, gameId, request.getCourseId()));
    }
}
