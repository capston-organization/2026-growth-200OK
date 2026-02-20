package growth._OK.backend.game.service;

import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.game.domain.Game;
import growth._OK.backend.game.domain.GameSource;
import growth._OK.backend.game.repository.GameRepository;
import growth._OK.backend.game.repository.GameSourceRepository;
import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;

@Slf4j
@Service
@RequiredArgsConstructor
public class GameSourceService {

    private final GameRepository gameRepository;
    private final GameSourceRepository gameSourceRepository;
    private final UserRepository userRepository;

    /** 소스(PDF/텍스트) 업로드 시 파일에서 텍스트 추출 후 저장. 프리뷰/문제 생성 시 Gemini가 이 텍스트를 사용함. */
    @Transactional
    public Long uploadSource(Long gameId, MultipartFile file, CustomUserDetails userDetails) {
        User user = findUser(userDetails);
        Game game = findGame(gameId);
        if (!game.getOwner().getUserId().equals(user.getUserId())) {
            throw new CapstonException(ExceptionCode.GAME_NOT_FOUND);
        }
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
        String contentType = file.getContentType() != null ? file.getContentType() : "";
        if (!contentType.contains("pdf") && !contentType.contains("text") && !originalFilename.toLowerCase().endsWith(".txt")) {
            throw new CapstonException(ExceptionCode.INVALID_SOURCE_FILE);
        }

        String extractedText = extractTextFromFile(file, originalFilename, contentType);
        extractedText = sanitizeForPostgres(extractedText);
        if (extractedText == null || extractedText.isBlank()) {
            throw new CapstonException(ExceptionCode.SOURCE_CONTENT_EMPTY);
        }

        String filePath = "sources/" + gameId + "/" + System.currentTimeMillis() + "_" + originalFilename;
        GameSource source = GameSource.builder()
                .owner(user)
                .filePath(filePath)
                .originalFileName(originalFilename)
                .extractedText(extractedText != null ? extractedText : "")
                .build();
        source = gameSourceRepository.save(source);
        game.setSource(source);
        return source.getId();
    }

    /** PDF는 PDFBox로, 텍스트 파일은 UTF-8로 추출. Gemini 프리뷰/문제 생성에 사용됨. */
    private String extractTextFromFile(MultipartFile file, String originalFilename, String contentType) {
        String lowerName = originalFilename.toLowerCase();
        boolean isPdf = contentType != null && contentType.contains("pdf") || lowerName.endsWith(".pdf");
        try {
            if (isPdf) {
                try (PDDocument document = Loader.loadPDF(file.getBytes())) {
                    PDFTextStripper stripper = new PDFTextStripper();
                    return stripper.getText(document);
                }
            } else {
                return new String(file.getBytes(), StandardCharsets.UTF_8);
            }
        } catch (Exception e) {
            log.warn("Failed to extract text from uploaded file: {}", originalFilename, e);
            return "";
        }
    }

    /** PostgreSQL UTF-8에서 허용하지 않는 문자 제거 (NUL 0x00 등). */
    private static String sanitizeForPostgres(String text) {
        if (text == null) return null;
        // NUL(0x00) 및 기타 C0 제어문자 제거 (PostgreSQL text 타입에서 오류 방지)
        return text.replace("\u0000", "")
                .replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F]", "");
    }

    private User findUser(CustomUserDetails userDetails) {
        return userRepository.findById(userDetails.getUser().getUserId())
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));
    }

    private Game findGame(Long gameId) {
        return gameRepository.findById(gameId)
                .orElseThrow(() -> new CapstonException(ExceptionCode.GAME_NOT_FOUND));
    }
}
