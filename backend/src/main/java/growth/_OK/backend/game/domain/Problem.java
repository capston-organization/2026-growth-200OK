package growth._OK.backend.game.domain;

import growth._OK.backend.global.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "problems")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Problem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "game_id", nullable = false)
    private Game game;

    @Column(nullable = false)
    private int sortOrder;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String question;

    /** 5지선다 등 선택지. JSON 배열 문자열 또는 콤마 구분 저장 */
    @Column(columnDefinition = "TEXT")
    private String optionsJson;

    @Column(name = "correct_answer", nullable = false)
    private String correctAnswer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProblemType type;

    /** AI 생성 해설. 없으면 null */
    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Builder
    public Problem(Game game, int sortOrder, String question, String optionsJson,
                   String correctAnswer, ProblemType type, String explanation) {
        this.game = game;
        this.sortOrder = sortOrder;
        this.question = question;
        this.optionsJson = optionsJson;
        this.correctAnswer = correctAnswer;
        this.type = type;
        this.explanation = explanation;
    }

    public void setExplanation(String explanation) {
        this.explanation = explanation;
    }
}
