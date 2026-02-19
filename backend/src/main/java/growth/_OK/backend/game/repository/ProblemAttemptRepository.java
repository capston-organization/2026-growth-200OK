package growth._OK.backend.game.repository;

import growth._OK.backend.game.domain.Problem;
import growth._OK.backend.game.domain.ProblemAttempt;
import growth._OK.backend.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProblemAttemptRepository extends JpaRepository<ProblemAttempt, Long> {
    List<ProblemAttempt> findByUserAndProblemOrderByAttemptOrderAsc(User user, Problem problem);
    Optional<ProblemAttempt> findFirstByUserAndProblemOrderByAttemptOrderAsc(User user, Problem problem);
}
