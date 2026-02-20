package growth._OK.backend.user.service;

import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.dto.request.UserBasicInfoRequestDto;
import growth._OK.backend.user.dto.response.UserBasicInfoResponseDto;
import growth._OK.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
}
