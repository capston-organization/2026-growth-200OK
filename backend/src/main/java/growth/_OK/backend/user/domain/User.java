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
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name="users")
public class User extends BaseEntity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    private String name;
    private String nickname;
    private String profileImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Provider provider;

    @Column(nullable = false)
    private String providerId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.STUDENT;

    private Integer birthYear;
    private String grade;
    private LocalDate birthDate;
    private String school;
    @Enumerated(EnumType.STRING)
    private Gender gender;

    @Column(nullable = false)
    private int coins = 0;

    @Column(nullable = false)
    private int happiness = 0;

    @Column(nullable = false)
    private int fullness = 0;

    @Column(nullable = false)
    private int level = 0;

    @Column(name = "google_classroom_refresh_token", length = 2048)
    private String googleClassroomRefreshToken;

    @Column(nullable = false)
    private boolean onboardingCompleted = false;

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

    public void updateName(String name) {
        this.name = name;
    }

    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }

    public void updateProfileImage(String profileImage) {
        this.profileImage = profileImage;
    }

    public void updateBasicInfo(String name, Integer birthYear, String grade,
                               LocalDate birthDate, String school, Gender gender) {
        if (name != null) this.name = name;
        if (birthYear != null) this.birthYear = birthYear;
        if (grade != null) this.grade = grade;
        if (birthDate != null) this.birthDate = birthDate;
        if (school != null) this.school = school;
        if (gender != null) this.gender = gender;
        this.onboardingCompleted = hasRequiredOnboardingFields();
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

    public void setGoogleClassroomRefreshToken(String googleClassroomRefreshToken) {
        this.googleClassroomRefreshToken = googleClassroomRefreshToken;
    }

    private boolean hasRequiredOnboardingFields() {
        return this.name != null && !this.name.isBlank()
                && this.birthYear != null
                && this.grade != null && !this.grade.isBlank();
    }

}