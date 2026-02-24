package growth._OK.backend.user.service;

import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.dto.request.UserBasicInfoRequestDto;
import growth._OK.backend.user.dto.response.GreetingResponseDto;
import growth._OK.backend.user.dto.response.UserBasicInfoResponseDto;
import growth._OK.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserBasicInfoResponseDto getBasicInfo(Long userId) {
        User user = findUser(userId);
        return UserBasicInfoResponseDto.from(user);
    }

    @Transactional
    public UserBasicInfoResponseDto updateBasicInfo(Long userId, UserBasicInfoRequestDto request) {
        User user = findUser(userId);
        user.updateBasicInfo(
                request.getName(),
                request.getBirthYear(),
                request.getGrade(),
                request.getBirthDate(),
                request.getSchool(),
                request.getGender()
        );
        return UserBasicInfoResponseDto.from(user);
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));
    }

    private static final List<String> GREETINGS = List.of(
                "오늘도 성장 게임하러 온 거야? 멋지다!",
                "작은 한 판이 큰 실력을 만든다. 시작해볼까?",
                "틀려도 괜찮아, 중요한 건 오늘도 도전했다는 거!",
                "어제의 나보다 한 문제만 더 잘 풀어보자.",
                "집중 모드 ON! 오늘도 파이팅!",
                "게임하듯이 배우는 영어, 오늘도 한 판!",
                "천천히, 하지만 꾸준히. 그게 진짜 성장이지."
        );

        public GreetingResponseDto getRandomGreeting() {
            int idx = ThreadLocalRandom.current().nextInt(GREETINGS.size());
            return GreetingResponseDto.builder()
                    .message(GREETINGS.get(idx))
                    .build();
        }
}
