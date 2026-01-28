package growth._OK.backend.user.domain;

import growth._OK.backend.global.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;


@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 아무런 매개변수가 없는 생성자를 생성하되 다른 패키지에 소속된 클래스는 접근 불허
@Table(name="users")
public class User extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    private String name;
    private String nickname;
    private String profileImage; //프로필 사진 URL

    @Enumerated(EnumType.STRING) // enum 이름을 DB에 저장
    @Column(nullable = false)
    private Provider provider; // 카카오

    @Column(nullable = false)
    private String providerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.STUDENT;

    // ---------------

    @Builder
    public User(String username, String providerId, String profileImage, Provider provider, Role role) {
        this.name = username;
        this.providerId =  providerId;
        this.profileImage = profileImage;
        this.provider = provider;
        this.role = role != null ? role : Role.STUDENT;
    }

    public static User fromGoogle(String name, String providerId, String profileImage, Provider provider) {
        return User.builder()
                .username(name)
                .providerId(providerId)
                .profileImage(profileImage)
                .provider(provider)
                .role(Role.STUDENT)
                .build();
    }

    // 이름 수정
    public void updateName(String name) {
        this.name = name;
    }
    // 닉네임 수정
    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }
    // 프로필 사진 수정
    public void updateProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }

}