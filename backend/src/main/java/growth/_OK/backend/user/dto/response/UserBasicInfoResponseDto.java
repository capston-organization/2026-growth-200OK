package growth._OK.backend.user.dto.response;

import growth._OK.backend.user.domain.Gender;
import growth._OK.backend.user.domain.Role;
import growth._OK.backend.user.domain.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
@AllArgsConstructor
public class UserBasicInfoResponseDto {
    private final Long userId;
    private final String name;
    private final String nickname;
    private final String profileImage;
    private final Integer birthYear;
    private final String grade;
    private final LocalDate birthDate;
    private final String school;
    private final Gender gender;
    private final Role role;
    private final boolean onboardingCompleted;

    public static UserBasicInfoResponseDto from(User user) {
        return UserBasicInfoResponseDto.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .nickname(user.getNickname())
                .profileImage(user.getProfileImage())
                .birthYear(user.getBirthYear())
                .grade(user.getGrade())
                .birthDate(user.getBirthDate())
                .school(user.getSchool())
                .gender(user.getGender())
                .role(user.getRole())
                .onboardingCompleted(user.isOnboardingCompleted())
                .build();
    }
}
