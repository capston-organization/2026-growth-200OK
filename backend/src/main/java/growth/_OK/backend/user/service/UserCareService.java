package growth._OK.backend.user.service;

import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.dto.response.CharacterStatusResponseDto;
import growth._OK.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserCareService {

    private static final int SNACK_COST = 1;
    private static final int PLAY_COST = 1;
    private static final int STUDY_COST = 2;

    private static final int SNACK_GAIN = 10;
    private static final int PLAY_GAIN = 10;

    private final UserRepository userRepository;

    @Transactional
    public CharacterStatusResponseDto giveSnack(Long userId) {
        User user = findUser(userId);
        if (user.getCoins() < SNACK_COST) {
            throw new CapstonException(ExceptionCode.INSUFFICIENT_COINS);
        }
        user.addCoins(-SNACK_COST);
        user.increaseFullness(SNACK_GAIN);
        return toStatus(user);
    }

    @Transactional
    public CharacterStatusResponseDto play(Long userId) {
        User user = findUser(userId);
        if (user.getCoins() < PLAY_COST) {
            throw new CapstonException(ExceptionCode.INSUFFICIENT_COINS);
        }
        user.addCoins(-PLAY_COST);
        user.increaseHappiness(PLAY_GAIN);
        return toStatus(user);
    }

    @Transactional
    public CharacterStatusResponseDto study(Long userId) {
        User user = findUser(userId);
        if (user.getCoins() < STUDY_COST) {
            throw new CapstonException(ExceptionCode.INSUFFICIENT_COINS);
        }
        user.addCoins(-STUDY_COST);
        user.levelUp();
        return toStatus(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));
    }

    private CharacterStatusResponseDto toStatus(User user) {
        return CharacterStatusResponseDto.builder()
                .coins(user.getCoins())
                .happiness(user.getHappiness())
                .fullness(user.getFullness())
                .level(user.getLevel())
                .build();
    }
}

