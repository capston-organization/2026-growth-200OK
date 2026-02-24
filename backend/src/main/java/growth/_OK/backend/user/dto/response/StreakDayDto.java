package growth._OK.backend.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;

@Getter
@Builder
@AllArgsConstructor
public class StreakDayDto {
    private final LocalDate date;
    private final boolean played;
}
