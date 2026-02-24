package growth._OK.backend.game.domain;

import growth._OK.backend.global.domain.BaseEntity;
import growth._OK.backend.user.domain.User;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "games")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Game extends BaseEntity {

    private static final int DEFAULT_PROBLEM_COUNT = 10;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private GameType type;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    // 학습 목표
    @Column(name = "learning_objectives", columnDefinition = "TEXT")
    private String learningObjectives;

    @Column(name = "is_public", nullable = false)
    private boolean isPublic;

    @Column(nullable = false)
    private int likeCount;

    // 게임에 포함될 문제 갯수 (기본: 10개)
    @Column(name = "problem_count", nullable = false)
    private int problemCount;

    // 허용 문제 유형 (단답형, O/X, 5지선다 중 선택)
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(name = "game_allowed_problem_types", joinColumns = @JoinColumn(name = "game_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "problem_type", length = 20)
    private List<ProblemType> allowedProblemTypes = new ArrayList<>();

    // 이 게임의 출제 소스 (업로드한 PDF/텍스트). 문제 생성 시 사용. null이면 문제 생성 불가
    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "source_id", nullable = true)
    private GameSource source;

    @OneToMany(mappedBy = "game", fetch = FetchType.LAZY, orphanRemoval = true)
    @OrderBy("sortOrder")
    private List<Problem> problems = new ArrayList<>();

    @Builder
    public Game(User owner, GameType type, String title, String description, String learningObjectives,
                boolean isPublic, int problemCount, List<ProblemType> allowedProblemTypes, GameSource source) {
        this.owner = owner;
        this.type = type;
        this.title = title;
        this.description = description;
        this.learningObjectives = learningObjectives;
        this.isPublic = isPublic;
        this.likeCount = 0;
        this.problemCount = problemCount <= 0 ? DEFAULT_PROBLEM_COUNT : problemCount;
        this.allowedProblemTypes = allowedProblemTypes != null ? new ArrayList<>(allowedProblemTypes) : new ArrayList<>();
        this.source = source;
    }

    public void increaseLikeCount() {
        this.likeCount++;
    }

    public void decreaseLikeCount() {
        if (this.likeCount > 0) {
            this.likeCount--;
        }
    }

    // 해당 게임에 소스 연결 (소스 업로드 시 호출)
    public void setSource(GameSource source) {
        this.source = source;
    }

    /** 게임 수정: 제목, 설명, 공개 방식만 변경 가능 */
    public void updateInfo(String title, String description, Boolean isPublic) {
        if (title != null && !title.isBlank()) {
            this.title = title;
        }
        if (description != null) {
            this.description = description;
        }
        if (isPublic != null) {
            this.isPublic = isPublic;
        }
    }
}
