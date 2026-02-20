package growth._OK.backend.game.domain;

import growth._OK.backend.global.domain.BaseEntity;
import growth._OK.backend.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "game_sources")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GameSource extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    /** 저장된 파일 경로 또는 스토리지 키 */
    @Column(nullable = false)
    private String filePath;

    /** 원본 파일명 */
    private String originalFileName;

    /** 추출된 텍스트 (PDF/텍스트에서). AI 생성 시 사용 */
    @Column(columnDefinition = "TEXT")
    private String extractedText;

    @Builder
    public GameSource(User owner, String filePath, String originalFileName, String extractedText) {
        this.owner = owner;
        this.filePath = filePath;
        this.originalFileName = originalFileName;
        this.extractedText = extractedText;
    }

    public void setExtractedText(String extractedText) {
        this.extractedText = extractedText;
    }
}
