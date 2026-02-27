package growth._OK.backend.user.domain;

import growth._OK.backend.global.domain.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;


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

    // 기본 정보 (로그인 후 입력/조회)
    private Integer birthYear;   // 필수
    private String grade;       // 필수 (예: 초등1, 중1, 고2)
    private LocalDate birthDate; // 선택
    private String school;      // 선택
    @Enumerated(EnumType.STRING)
    private Gender gender;      // 선택

    // 보유 코인 (기본 0)
    @Column(nullable = false)
    private int coins = 0;

    // 간단한 육성 상태
    @Column(nullable = false)
    private int happiness = 0;   // 놀아주기 누적

    @Column(nullable = false)
    private int fullness = 0;    // 간식 누적

    @Column(nullable = false)
    private int level = 0;       // 공부 레벨

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

    // 기본 정보 수정
    public void updateBasicInfo(String name, Integer birthYear, String grade,
                               LocalDate birthDate, String school, Gender gender) {
        if (name != null) this.name = name;
        if (birthYear != null) this.birthYear = birthYear;
        if (grade != null) this.grade = grade;
        if (birthDate != null) this.birthDate = birthDate;
        if (school != null) this.school = school;
        if (gender != null) this.gender = gender;
    }

    public void addCoins(int amount) {
        this.coins += amount;
        if (this.coins < 0) {
            this.coins = 0;
        }
    }

    public void increaseHappiness(int amount) {
        if (amount <= 0) return;
        this.happiness += amount;
    }

    public void increaseFullness(int amount) {
        if (amount <= 0) return;
        this.fullness += amount;
    }

    public void levelUp() {
        this.level += 1;
    }

}