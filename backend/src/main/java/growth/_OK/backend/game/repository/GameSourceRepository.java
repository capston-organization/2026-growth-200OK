package growth._OK.backend.game.repository;

import growth._OK.backend.game.domain.GameSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GameSourceRepository extends JpaRepository<GameSource, Long> {
}
