package growth._OK.backend.global.exception;

public enum ClientExceptionCode {
    // 전체
    INTERNAL_SERVER_ERROR,
    ILLEGAL_ARGUMENT,

    // 사용자
    AUTH_TOKEN_EMPTY,
    ACCESS_TOKEN_EMPTY,
    REFRESH_TOKEN_EMPTY,
    AUTH_TOKEN_EXPIRED,
    AUTH_TOKEN_INVALID,
    AUTH_TOKEN_MISMATCH,
    USER_NOT_FOUND,

    // 게임
    GAME_NOT_FOUND,
}
