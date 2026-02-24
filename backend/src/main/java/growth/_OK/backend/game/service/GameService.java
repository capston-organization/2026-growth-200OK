package growth._OK.backend.game.service;

import growth._OK.backend.auth.jwt.CustomUserDetails;
import growth._OK.backend.game.domain.Game;
import growth._OK.backend.game.domain.GameLike;
import growth._OK.backend.game.dto.ResponseDto.GameListResponseDto;
import growth._OK.backend.game.dto.ResponseDto.GameResponseDto;
import growth._OK.backend.game.dto.requestDto.GameCreateRequestDto;
import growth._OK.backend.game.dto.requestDto.GameUpdateRequestDto;
import growth._OK.backend.game.domain.GameSource;
import growth._OK.backend.game.repository.GameLikeRepository;
import growth._OK.backend.game.repository.GameRepository;
import growth._OK.backend.game.repository.GameSourceRepository;
import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import growth._OK.backend.user.domain.User;
import growth._OK.backend.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GameService {

    private final GameRepository gameRepository;
    private final GameLikeRepository gameLikeRepository;
    private final GameSourceRepository gameSourceRepository;
    private final UserRepository userRepository;

    // 게임 생성
    public GameResponseDto createGame(GameCreateRequestDto request, CustomUserDetails userDetails) {
        User owner = findUser(userDetails);
        int problemCount = (request.getProblemCount() == null || request.getProblemCount() <= 0)
                ? 10
                : request.getProblemCount();

        GameSource source = null;
        if (request.getSourceId() != null) {
            source = gameSourceRepository.findById(request.getSourceId())
                    .orElseThrow(() -> new CapstonException(ExceptionCode.GAME_SOURCE_NOT_FOUND));
            if (!source.getOwner().getUserId().equals(owner.getUserId())) {
                throw new CapstonException(ExceptionCode.GAME_SOURCE_NOT_FOUND);
            }
        }

        Game game = Game.builder()
                .owner(owner)
                .type(request.getType())
                .title(request.getTitle())
                .description(request.getDescription())
                .learningObjectives(request.getLearningObjectives())
                .isPublic(request.getIsPublic() == null || request.getIsPublic())
                .problemCount(problemCount)
                .allowedProblemTypes(request.getProblemTypes() != null ? request.getProblemTypes() : List.of())
                .source(source)
                .build();

        return GameResponseDto.from(gameRepository.save(game));
    }

    // 게임 전체 조회 (Option: 제목으로 검색기능)
    @Transactional(readOnly = true)
    public GameListResponseDto getGames(String title, CustomUserDetails userDetails) {
        List<Game> games = (title == null || title.isBlank())
                ? gameRepository.findAll()
                : gameRepository.findByTitleContainingIgnoreCase(title);

        games = games.stream()
                .filter(Game::isPublic)
                .toList();

        User user = userDetails != null ? findUser(userDetails) : null;

        List<GameResponseDto> responses = games.stream()
                .map(game -> GameResponseDto.from(game, user != null && gameLikeRepository.existsByGameAndUser(game, user)))
                .collect(Collectors.toList());
        return GameListResponseDto.from(responses);
    }

    // 공개 게임 전체 조회 (최신순)
    @Transactional(readOnly = true)
    public GameListResponseDto getPublicGamesLatest(CustomUserDetails userDetails) {
        User user = userDetails != null ? findUser(userDetails) : null;
        List<Game> games = gameRepository.findByIsPublicTrueOrderByCreatedAtDesc();
        List<GameResponseDto> responses = games.stream()
                .map(game -> GameResponseDto.from(game,
                        user != null && gameLikeRepository.existsByGameAndUser(game, user)))
                .collect(Collectors.toList());
        return GameListResponseDto.from(responses);
    }

    // 내가 만든 게임 전체 조회
    @Transactional(readOnly = true)
    public GameListResponseDto getMyGames(CustomUserDetails userDetails) {
        User user = findUser(userDetails);
        List<GameResponseDto> responses = gameRepository.findByOwnerOrderByCreatedAtDesc(user).stream()
                .map(game -> GameResponseDto.from(game, gameLikeRepository.existsByGameAndUser(game, user)))
                .collect(Collectors.toList());
        return GameListResponseDto.from(responses);
    }

    // 내가 좋아요한 게임 조회
    @Transactional(readOnly = true)
    public GameListResponseDto getLikedGames(CustomUserDetails userDetails) {
        User user = findUser(userDetails);
        List<GameResponseDto> responses = gameLikeRepository.findByUser(user).stream()
                .map(GameLike::getGame)
                .map(game -> GameResponseDto.from(game, true))
                .collect(Collectors.toList());
        return GameListResponseDto.from(responses);
    }

    // 게임 수정 (제목, 설명, 공개 방식만). 본인 게임만 수정 가능
    @Transactional
    public GameResponseDto updateGame(Long gameId, GameUpdateRequestDto request, CustomUserDetails userDetails) {
        User user = findUser(userDetails);
        Game game = findGame(gameId);
        if (!game.getOwner().getUserId().equals(user.getUserId())) {
            throw new CapstonException(ExceptionCode.GAME_NOT_FOUND);
        }
        game.updateInfo(request.getTitle(), request.getDescription(), request.getIsPublic());
        boolean isLiked = gameLikeRepository.existsByGameAndUser(game, user);
        return GameResponseDto.from(game, isLiked);
    }

    // 좋아요 누르기 / 취소
    @Transactional
    public GameResponseDto toggleLike(Long gameId, CustomUserDetails userDetails) {
        User user = findUser(userDetails);
        Game game = findGame(gameId);

        boolean liked = gameLikeRepository.findByGameAndUser(game, user)
                .map(existing -> {
                    gameLikeRepository.delete(existing);
                    game.decreaseLikeCount();
                    return false;
                })
                .orElseGet(() -> {
                    gameLikeRepository.save(GameLike.builder().game(game).user(user).build());
                    game.increaseLikeCount();
                    return true;
                });

        return GameResponseDto.from(game, liked);
    }

    // --------------------------------

    // user 찾기
    @Transactional(readOnly = true)
    private User findUser(CustomUserDetails userDetails){
        return userRepository.findById(userDetails.getUser().getUserId())
                .orElseThrow(() -> new CapstonException(ExceptionCode.USER_NOT_FOUND));
    }

    // game 찾기
    @Transactional(readOnly = true)
    private Game findGame(Long gameId){
        return gameRepository.findById(gameId)
                .orElseThrow(() -> new CapstonException(ExceptionCode.GAME_NOT_FOUND));
    }

}
