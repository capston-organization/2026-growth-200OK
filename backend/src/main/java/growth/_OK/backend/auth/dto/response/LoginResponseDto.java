package growth._OK.backend.auth.dto.response;

import growth._OK.backend.user.domain.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class LoginResponseDto {
    private final Long userId;
    private final String userName;
    private final boolean onboardingCompleted;

    public static LoginResponseDto from(User user) {
        return LoginResponseDto.builder()
                .userId(user.getUserId())
                .userName(user.getName())
                .onboardingCompleted(user.isOnboardingCompleted())
                .build();
    }
}
