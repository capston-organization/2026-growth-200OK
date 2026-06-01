package growth._OK.backend.game.repository;

import growth._OK.backend.game.domain.Game;
import growth._OK.backend.game.domain.GameLike;
import growth._OK.backend.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GameLikeRepository extends JpaRepository<GameLike, Long> {

    Optional<GameLike> findByGameAndUser(Game game, User user);

    boolean existsByGameAndUser(Game game, User user);

    List<GameLike> findByUser(User user);

    void deleteByGameAndUser(Game game, User user);

    void deleteByGame(Game game);
}
