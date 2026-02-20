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

    /** 해당 제출이 정답인지 */
    @Column(nullable = false)
    private boolean correct;

    /** 이 문제에 대한 해당 유저의 제출 순서 (1=첫 시도) */
    @Column(nullable = false)
    private int attemptOrder;

    @Builder
    public ProblemAttempt(User user, Problem problem, boolean correct, int attemptOrder) {
        this.user = user;
        this.problem = problem;
        this.correct = correct;
        this.attemptOrder = attemptOrder;
    }
}
