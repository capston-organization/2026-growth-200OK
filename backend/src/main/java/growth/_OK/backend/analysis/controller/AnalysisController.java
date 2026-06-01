package growth._OK.backend.analysis.controller;

import growth._OK.backend.analysis.dto.request.CreateReviewGameRequestDto;
import growth._OK.backend.analysis.dto.response.AnalysisDetailResponseDto;
import growth._OK.backend.analysis.dto.response.AnalysisOverviewResponseDto;
import growth._OK.backend.analysis.dto.response.CreateReviewGameResponseDto;
import growth._OK.backend.analysis.dto.response.WrongAnswerListResponseDto;
import growth._OK.backend.analysis.service.AnalysisService;
import growth._OK.backend.auth.jwt.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @GetMapping("/me/overview")
    public ResponseEntity<AnalysisOverviewResponseDto> getOverview(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(analysisService.getOverview(user));
    }

    @GetMapping("/me/detail")
    public ResponseEntity<AnalysisDetailResponseDto> getDetail(
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        return ResponseEntity.ok(analysisService.getDetail(user));
    }

    @GetMapping("/me/wrong-answers")
    public ResponseEntity<WrongAnswerListResponseDto> getWrongAnswers(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate
    ) {
        return ResponseEntity.ok(
                analysisService.getWrongAnswers(user, category, scope, fromDate, toDate)
        );
    }

    @PostMapping("/me/review-games")
    public ResponseEntity<CreateReviewGameResponseDto> createReviewGame(
            @AuthenticationPrincipal CustomUserDetails user,
            @RequestBody(required = false) CreateReviewGameRequestDto request
    ) {
        return ResponseEntity.ok(analysisService.createReviewGame(user, request));
    }
}
