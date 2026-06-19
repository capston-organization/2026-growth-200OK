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

    @Query("select pa.problem.game from ProblemAttempt pa " +
           "where pa.user = :user " +
           "group by pa.problem.game " +
           "order by max(pa.createdAt) desc")
    List<Game> findRecentPlayedGames(@Param("user") User user);
}
