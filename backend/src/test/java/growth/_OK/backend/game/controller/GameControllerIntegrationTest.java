package growth._OK.backend.game.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.game.domain.Game;
import growth._OK.backend.game.domain.GameLike;
import growth._OK.backend.game.domain.GameType;
import growth._OK.backend.game.dto.requestDto.GameCreateRequestDto;
import growth._OK.backend.game.repository.GameLikeRepository;
import growth._OK.backend.game.repository.GameRepository;
import growth._OK.backend.user.domain.Provider;
import growth._OK.backend.user.domain.Role;
import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import growth._OK.backend.config.TestRedisConfig;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc(addFilters = false)
@ActiveProfiles("test")
@ContextConfiguration(classes = {TestRedisConfig.class})
@Transactional
class GameControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private ObjectMapper objectMapper;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private GameRepository gameRepository;
    @Autowired
    private GameLikeRepository gameLikeRepository;

    private CustomUserDetails principal;
    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .username("tester")
                .providerId("pid")
                .profileImage("img")
                .provider(Provider.GOOGLE)
                .role(Role.STUDENT)
                .build();
        user = userRepository.save(user);
        principal = new CustomUserDetails(user);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities())
        );
    }

    @Test
    @DisplayName("게임 생성 API는 201 Created와 본문을 반환한다")
    void createGame() throws Exception {
        GameCreateRequestDto request = new GameCreateRequestDto(GameType.GRAMMAR, "title", "desc", true);

        mockMvc.perform(post("/api/games")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                        .with(SecurityMockMvcRequestPostProcessors.user(principal)))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", containsString("/api/games/")))
                .andExpect(jsonPath("$.title", is("title")))
                .andExpect(jsonPath("$.type", is("GRAMMAR")))
                .andExpect(jsonPath("$.likeCount", is(0)));
    }

    @Test
    @DisplayName("제목 검색이 없으면 전체 게임을, 검색어가 있으면 필터링된 리스트를 반환한다")
    void getGames() throws Exception {
        Game g1 = gameRepository.save(Game.builder()
                .owner(user)
                .type(GameType.GRAMMAR)
                .title("grammar basics")
                .description("desc1")
                .isPublic(true)
                .build());
        Game g2 = gameRepository.save(Game.builder()
                .owner(user)
                .type(GameType.VOCAB)
                .title("vocab practice")
                .description("desc2")
                .isPublic(true)
                .build());

        gameLikeRepository.save(GameLike.builder().game(g1).user(user).build());

        mockMvc.perform(get("/api/games")
                        .with(SecurityMockMvcRequestPostProcessors.user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.games", hasSize(2)));

        mockMvc.perform(get("/api/games")
                        .param("title", "grammar")
                        .with(SecurityMockMvcRequestPostProcessors.user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.games", hasSize(1)))
                .andExpect(jsonPath("$.games[0].isLiked", is(true)));
    }

    @Test
    @DisplayName("좋아요 토글 API는 상태를 반영한 GameResponseDto를 반환한다")
    void toggleLike() throws Exception {
        Game game = gameRepository.save(Game.builder()
                .owner(user)
                .type(GameType.VOCAB)
                .title("practice")
                .description("desc")
                .isPublic(true)
                .build());
        ReflectionTestUtils.setField(game, "id", game.getId());

        mockMvc.perform(post("/api/games/{id}/like", game.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isLiked", is(true)))
                .andExpect(jsonPath("$.likeCount", is(1)));

        mockMvc.perform(post("/api/games/{id}/like", game.getId())
                        .with(SecurityMockMvcRequestPostProcessors.user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isLiked", is(false)))
                .andExpect(jsonPath("$.likeCount", is(0)));
    }

    @Test
    @DisplayName("내가 좋아요한 게임 목록을 반환한다")
    void getLikedGames() throws Exception {
        Game likedGame = gameRepository.save(Game.builder()
                .owner(user)
                .type(GameType.GRAMMAR)
                .title("grammar liked")
                .description("desc")
                .isPublic(true)
                .build());

        gameLikeRepository.save(GameLike.builder().game(likedGame).user(user).build());

        mockMvc.perform(get("/api/games/likes/me")
                        .with(SecurityMockMvcRequestPostProcessors.user(principal)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.games", hasSize(1)))
                .andExpect(jsonPath("$.games[0].isLiked", is(true)))
                .andExpect(jsonPath("$.games[0].title", is("grammar liked")));
    }
}
