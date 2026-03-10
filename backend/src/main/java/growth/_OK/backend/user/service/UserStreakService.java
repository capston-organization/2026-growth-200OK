package growth._OK.backend.user.service;

import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.domain.UserPlayDate;
import growth._OK.backend.user.dto.response.StreakDayDto;
import growth._OK.backend.user.dto.response.StreakResponseDto;
import growth._OK.backend.user.repository.UserPlayDateRepository;
import growth._OK.backend.user.repository.UserRepository;
import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserStreakService {

    private static final int DEFAULT_DAYS = 30;
    private static final int MAX_DAYS = 365;

    private final UserPlayDateRepository userPlayDateRepository;
    private final UserRepository userRepository;

    @Transactional
    public void recordPlayToday(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));
        LocalDate today = LocalDate.now();
        if (userPlayDateRepository.existsByUserAndPlayDate(user, today)) {
            return;
        }
        userPlayDateRepository.save(UserPlayDate.builder()
                .user(user)
                .playDate(today)
                .build());
    }

    @Transactional(readOnly = true)
    public StreakResponseDto getStreakData(Long userId, Integer days) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));

        int limit = days != null && days > 0 ? Math.min(days, MAX_DAYS) : DEFAULT_DAYS;
        LocalDate end = LocalDate.now();
        LocalDate start = end.minusDays(limit - 1);

        List<UserPlayDate> playedList = userPlayDateRepository.findByUserAndPlayDateBetweenOrderByPlayDateAsc(user, start, end);
        Set<LocalDate> playedDates = playedList.stream()
                .map(UserPlayDate::getPlayDate)
                .collect(Collectors.toSet());

        List<StreakDayDto> dateList = new ArrayList<>();
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            dateList.add(StreakDayDto.builder()
                    .date(d)
                    .played(playedDates.contains(d))
                    .build());
        }

        int currentStreak = computeCurrentStreak(playedDates, end);

        return StreakResponseDto.builder()
                .dates(dateList)
                .currentStreak(currentStreak)
                .build();
    }

    private int computeCurrentStreak(Set<LocalDate> playedDates, LocalDate today) {
        if (!playedDates.contains(today)) {
            return 0;
        }
        int count = 1;
        LocalDate d = today.minusDays(1);
        while (playedDates.contains(d)) {
            count++;
            d = d.minusDays(1);
        }
        return count;
    }
}
