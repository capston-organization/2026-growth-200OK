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

    @Column(columnDefinition = "TEXT")
    private String optionsJson;

    @Column(name = "correct_answer", nullable = false)
    private String correctAnswer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProblemType type;

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
