package growth._OK.backend.user.repository;

import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.domain.UserPlayDate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface UserPlayDateRepository extends JpaRepository<UserPlayDate, Long> {

    boolean existsByUserAndPlayDate(User user, LocalDate playDate);

    List<UserPlayDate> findByUserAndPlayDateBetweenOrderByPlayDateAsc(User user, LocalDate start, LocalDate end);
}
