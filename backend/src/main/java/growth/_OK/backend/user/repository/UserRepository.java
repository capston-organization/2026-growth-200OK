package growth._OK.backend.user.repository;


import growth._OK.backend.user.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUserId(Long userId);
    boolean existsByProviderId(String providerId);
    Optional<User> findByProviderId(String providerId);
}
