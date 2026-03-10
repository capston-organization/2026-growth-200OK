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

    @Column(nullable = false)
    private String filePath;

    private String originalFileName;

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
