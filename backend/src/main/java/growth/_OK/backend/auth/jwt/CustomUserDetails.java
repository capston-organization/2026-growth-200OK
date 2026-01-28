package growth._OK.backend.auth.jwt;


import growth._OK.backend.user.domain.User;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

@Getter
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final User user;

    public User getUser() {return this.user;}

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // ROLE_ 접두사는 Spring Security 권장 컨벤션
        return List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()));
    }

    // 자체 로그인 X
    @Override public String getPassword() {return null;}

    // userId
    @Override public String getUsername() {return user.getUserId().toString();}


    @Override public boolean isAccountNonExpired() {return true;}
    @Override public boolean isAccountNonLocked() {return true;}
    @Override public boolean isCredentialsNonExpired() {return true;}
    @Override public boolean isEnabled() {return true;}

}
