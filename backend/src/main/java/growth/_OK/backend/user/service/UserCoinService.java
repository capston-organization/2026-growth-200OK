package growth._OK.backend.user.service;

import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserCoinService {

    private final UserRepository userRepository;

    @Transactional
    public int addCoins(Long userId, int amount) {
        if (amount <= 0) {
            return getCoins(userId);
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));
        user.addCoins(amount);
        return user.getCoins();
    }

    @Transactional(readOnly = true)
    public int getCoins(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));
        return user.getCoins();
    }
}

