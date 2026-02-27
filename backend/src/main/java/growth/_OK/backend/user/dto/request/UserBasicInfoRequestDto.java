package growth._OK.backend.user.dto.request;

import growth._OK.backend.user.domain.Gender;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
@AllArgsConstructor
public class UserBasicInfoRequestDto {
    @NotBlank(message = "이름은 필수입니다.")
    private final String name;
    @NotNull(message = "출생 연도는 필수입니다.")
    private final Integer birthYear;
    @NotBlank(message = "학년은 필수입니다.")
    private final String grade;
    private final LocalDate birthDate;
    private final String school;
    private final Gender gender;
}
