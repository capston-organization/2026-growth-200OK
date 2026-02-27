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

    private static final String INLINE_SOURCE_PATH = "inline";

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

        GameSource source = game.getSource();
        if (source != null) {
            String existing = source.getExtractedText() != null ? source.getExtractedText() : "";
            source.setExtractedText(existing.isBlank() ? extractedText : existing + "\n\n" + extractedText);
            return gameSourceRepository.save(source).getId();
        }

        String filePath = "sources/" + gameId + "/" + System.currentTimeMillis() + "_" + originalFilename;
        source = GameSource.builder()
                .owner(user)
                .filePath(filePath)
                .originalFileName(originalFilename)
                .extractedText(extractedText)
                .build();
        source = gameSourceRepository.save(source);
        game.setSource(source);
        return source.getId();
    }

    @Transactional
    public Long addTextSource(Long gameId, String text, CustomUserDetails userDetails) {
        User user = findUser(userDetails);
        Game game = findGame(gameId);
        if (!game.getOwner().getUserId().equals(user.getUserId())) {
            throw new CapstonException(ExceptionCode.GAME_NOT_FOUND);
        }
        String sanitized = sanitizeForPostgres(text);
        if (sanitized == null || sanitized.isBlank()) {
            throw new CapstonException(ExceptionCode.SOURCE_CONTENT_EMPTY);
        }

        GameSource source = game.getSource();
        if (source != null) {
            String existing = source.getExtractedText() != null ? source.getExtractedText() : "";
            source.setExtractedText(existing.isBlank() ? sanitized : existing + "\n\n" + sanitized);
            return gameSourceRepository.save(source).getId();
        }

        source = GameSource.builder()
                .owner(user)
                .filePath(INLINE_SOURCE_PATH)
                .originalFileName("user_input")
                .extractedText(sanitized)
                .build();
        source = gameSourceRepository.save(source);
        game.setSource(source);
        return source.getId();
    }

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

    private static String sanitizeForPostgres(String text) {
        if (text == null) return null;
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
