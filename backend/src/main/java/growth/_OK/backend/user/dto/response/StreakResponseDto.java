package growth._OK.backend.user.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class StreakResponseDto {
    /// 기간 내 날짜별 플레이 여부 (과거 → 오늘 순)
    private final List<StreakDayDto> dates;
    // 오늘 포함 연속 플레이 일수. 오늘 미플레이면 0
    private final int currentStreak;
}
