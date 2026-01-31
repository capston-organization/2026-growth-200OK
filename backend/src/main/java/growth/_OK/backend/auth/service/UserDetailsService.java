package growth._OK.backend.auth.service;

import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsService implements org.springframework.security.core.userdetails.UserDetailsService {
    private final UserRepository userRepository;

    @Override //얘는 반드시 String 기반으로 호출해야함 Long 하니까 안됨
    public CustomUserDetails loadUserByUsername(String userId) throws UsernameNotFoundException {
        User user = userRepository.findById(Long.valueOf(userId))
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));
        return new CustomUserDetails(user);
    }
}