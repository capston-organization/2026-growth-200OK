package growth._OK.backend.game.service;

import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.game.domain.Game;
import growth._OK.backend.game.domain.GameLike;
import growth._OK.backend.game.domain.GameType;
import growth._OK.backend.game.dto.ResponseDto.GameListResponseDto;
import growth._OK.backend.game.dto.ResponseDto.GameResponseDto;
import growth._OK.backend.game.dto.requestDto.GameCreateRequestDto;
import growth._OK.backend.game.repository.GameLikeRepository;
import growth._OK.backend.game.repository.GameRepository;
import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import growth._OK.backend.user.domain.Provider;
import growth._OK.backend.user.domain.Role;
import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    private GameRepository gameRepository;
    @Mock
    private GameLikeRepository gameLikeRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GameService gameService;

    @Test
    @DisplayName("게임을 생성하면 저장된 게임 정보가 반환된다")
    void createGame_returnsSavedGame() {
        User user = dummyUser(1L);
        CustomUserDetails principal = new CustomUserDetails(user);
        GameCreateRequestDto req = new GameCreateRequestDto(GameType.GRAMMAR, "title", "desc", true);

        Game saved = Game.builder()
                .owner(user)
                .type(GameType.GRAMMAR)
                .title("title")
                .description("desc")
                .isPublic(true)
                .build();
        ReflectionTestUtils.setField(saved, "id", 1L);

        given(userRepository.findById(user.getUserId())).willReturn(Optional.of(user));
        given(gameRepository.save(any(Game.class))).willReturn(saved);

        GameResponseDto result = gameService.createGame(req, principal);

        assertThat(result.getTitle()).isEqualTo("title");
        assertThat(result.getType()).isEqualTo(GameType.GRAMMAR);
        verify(gameRepository).save(any(Game.class));
    }

    @Test
    @DisplayName("제목 검색 없이 전체 조회 시 GameListResponseDto를 반환한다")
    void getGames_returnsAll() {
        User user = dummyUser(1L);
        CustomUserDetails principal = new CustomUserDetails(user);
        Game game = Game.builder()
                .owner(user)
                .type(GameType.VOCAB)
                .title("english")
                .description("desc")
                .isPublic(true)
                .build();
        ReflectionTestUtils.setField(game, "id", 2L);

        given(gameRepository.findAll()).willReturn(List.of(game));
        given(userRepository.findById(user.getUserId())).willReturn(Optional.of(user));
        given(gameLikeRepository.existsByGameAndUser(game, user)).willReturn(true);

        GameListResponseDto result = gameService.getGames(null, principal);

        assertThat(result.getGames()).hasSize(1);
        assertThat(result.getGames().get(0).isLiked()).isTrue();
    }

    @Test
    @DisplayName("내가 좋아요한 게임 목록을 반환한다")
    void getLikedGames_returnsLiked() {
        User user = dummyUser(1L);
        CustomUserDetails principal = new CustomUserDetails(user);
        Game game = Game.builder()
                .owner(user)
                .type(GameType.VOCAB)
                .title("english")
                .description("desc")
                .isPublic(true)
                .build();
        ReflectionTestUtils.setField(game, "id", 3L);

        given(userRepository.findById(user.getUserId())).willReturn(Optional.of(user));
        given(gameLikeRepository.findByUser(user)).willReturn(List.of(GameLike.builder().game(game).user(user).build()));

        GameListResponseDto result = gameService.getLikedGames(principal);

        assertThat(result.getGames()).hasSize(1);
        assertThat(result.getGames().get(0).isLiked()).isTrue();
    }

    @Test
    @DisplayName("게임 좋아요 토글 - 없으면 생성, 있으면 삭제")
    void toggleLike_togglesState() {
        User user = dummyUser(1L);
        CustomUserDetails principal = new CustomUserDetails(user);
        Game game = Game.builder()
                .owner(user)
                .type(GameType.GRAMMAR)
                .title("grammar")
                .description("desc")
                .isPublic(true)
                .build();
        ReflectionTestUtils.setField(game, "id", 10L);

        given(userRepository.findById(user.getUserId())).willReturn(Optional.of(user));
        given(gameRepository.findById(10L)).willReturn(Optional.of(game));
        given(gameLikeRepository.findByGameAndUser(game, user)).willReturn(Optional.empty());

        GameResponseDto liked = gameService.toggleLike(10L, principal);
        assertThat(liked.isLiked()).isTrue();
        assertThat(liked.getLikeCount()).isEqualTo(1);

        given(gameLikeRepository.findByGameAndUser(game, user)).willReturn(Optional.of(GameLike.builder().game(game).user(user).build()));

        GameResponseDto unliked = gameService.toggleLike(10L, principal);
        assertThat(unliked.isLiked()).isFalse();
        assertThat(unliked.getLikeCount()).isEqualTo(0);
    }

    @Test
    @DisplayName("존재하지 않는 게임이면 GAME_NOT_FOUND 예외")
    void toggleLike_gameNotFound() {
        User user = dummyUser(1L);
        CustomUserDetails principal = new CustomUserDetails(user);

        given(userRepository.findById(user.getUserId())).willReturn(Optional.of(user));
        given(gameRepository.findById(99L)).willReturn(Optional.empty());

        assertThatThrownBy(() -> gameService.toggleLike(99L, principal))
                .isInstanceOf(CapstonException.class)
                .hasMessageContaining(ExceptionCode.GAME_NOT_FOUND.getMessage());
    }

    private User dummyUser(Long id) {
        User user = User.builder()
                .username("user" + id)
                .providerId("pid" + id)
                .profileImage("img")
                .provider(Provider.GOOGLE)
                .role(Role.STUDENT)
                .build();
        ReflectionTestUtils.setField(user, "userId", id);
        return user;
    }
}
