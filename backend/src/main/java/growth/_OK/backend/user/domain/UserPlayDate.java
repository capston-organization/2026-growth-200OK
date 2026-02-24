package growth._OK.backend.user.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

// 유저가 해당 날짜에 게임을 플레이했는지 기록.
// (user, playDate) 당 1건만 저장 → 오늘 플레이했으면 스트릭 유지, 아니면 빈칸.
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "user_play_dates", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "play_date"})
})
public class UserPlayDate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "play_date", nullable = false)
    private LocalDate playDate;

    @Builder
    public UserPlayDate(User user, LocalDate playDate) {
        this.user = user;
        this.playDate = playDate;
    }
}
