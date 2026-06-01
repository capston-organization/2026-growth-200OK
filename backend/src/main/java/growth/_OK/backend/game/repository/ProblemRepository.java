package growth._OK.backend.game.repository;

import growth._OK.backend.game.domain.Game;
import growth._OK.backend.game.domain.Problem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {
    List<Problem> findByGameOrderBySortOrderAsc(Game game);
    List<Problem> findByGame_IdOrderBySortOrderAsc(Long gameId);
    void deleteByGame(Game game);
}
