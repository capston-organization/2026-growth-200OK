package growth._OK.backend.game.repository;

import growth._OK.backend.game.domain.Game;
import growth._OK.backend.game.domain.Problem;
import growth._OK.backend.game.domain.ProblemAttempt;
import growth._OK.backend.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProblemAttemptRepository extends JpaRepository<ProblemAttempt, Long> {
    List<ProblemAttempt> findByUserAndProblemOrderByAttemptOrderAsc(User user, Problem problem);
    Optional<ProblemAttempt> findFirstByUserAndProblemOrderByAttemptOrderAsc(User user, Problem problem);

    // 유저가 플레이한 게임들 중, 최근에 시도한 순서대로 조회.
    // (게임당 최대 1개, ProblemAttempt.createdAt의 max 기준)
    @Query("select pa.problem.game from ProblemAttempt pa " +
           "where pa.user = :user " +
           "group by pa.problem.game " +
           "order by max(pa.createdAt) desc")
    List<Game> findRecentPlayedGames(@Param("user") User user);
}
