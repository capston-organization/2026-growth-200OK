package growth._OK.backend.game.domain;

import growth._OK.backend.global.domain.BaseEntity;
import growth._OK.backend.user.domain.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "problem_attempts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProblemAttempt extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;

    @Column(nullable = false)
    private boolean correct;

    @Column(nullable = false)
    private int attemptOrder;

    @Column(name = "response_time_ms")
    private Integer responseTimeMs;

    @Column(name = "hint_used", nullable = false)
    private boolean hintUsed;

    @Column(name = "explanation_opened", nullable = false)
    private boolean explanationOpened;

    @Column(name = "chosen_answer", columnDefinition = "TEXT")
    private String chosenAnswer;

    @Column(name = "submitted_text", columnDefinition = "TEXT")
    private String submittedText;

    @Builder
    public ProblemAttempt(User user, Problem problem, boolean correct, int attemptOrder,
                          Integer responseTimeMs, boolean hintUsed, boolean explanationOpened,
                          String chosenAnswer, String submittedText) {
        this.user = user;
        this.problem = problem;
        this.correct = correct;
        this.attemptOrder = attemptOrder;
        this.responseTimeMs = responseTimeMs;
        this.hintUsed = hintUsed;
        this.explanationOpened = explanationOpened;
        this.chosenAnswer = chosenAnswer;
        this.submittedText = submittedText;
    }
}
