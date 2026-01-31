package growth._OK.backend.global.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ExceptionCode {
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, ClientExceptionCode.INTERNAL_SERVER_ERROR, "예상치 못한 서버에러가 발생했습니다."),
    ILLEGAL_ARGUMENT(HttpStatus.BAD_REQUEST, ClientExceptionCode.ILLEGAL_ARGUMENT, "필수 파라미터 누락"),

    // 유저
    AUTH_TOKEN_EMPTY(HttpStatus.UNAUTHORIZED, ClientExceptionCode.AUTH_TOKEN_EMPTY, "다시 로그인해주세요."),
    ACCESS_TOKEN_EMPTY(HttpStatus.UNAUTHORIZED, ClientExceptionCode.ACCESS_TOKEN_EMPTY, "엑세스 토큰이 존재하지 않습니다. 다시 로그인해주세요."),
    REFRESH_TOKEN_EMPTY(HttpStatus.UNAUTHORIZED, ClientExceptionCode.REFRESH_TOKEN_EMPTY, "리프레시 토큰이 존재하지 않습니다."),
    AUTH_TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, ClientExceptionCode.AUTH_TOKEN_EXPIRED, "만료된 토큰입니다."),
    AUTH_TOKEN_INVALID(HttpStatus.UNAUTHORIZED, ClientExceptionCode.AUTH_TOKEN_INVALID, "올바르지 않은 토큰 정보입니다."),
    AUTH_TOKEN_MISMATCH(HttpStatus.UNAUTHORIZED, ClientExceptionCode.AUTH_TOKEN_MISMATCH, "액세스 토큰과 리프레시 토큰의 소유자가 일치하지 않습니다."),
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, ClientExceptionCode.USER_NOT_FOUND, "찾을 수 없는 유저입니다."),

    // 게임
    GAME_NOT_FOUND(HttpStatus.NOT_FOUND, ClientExceptionCode.GAME_NOT_FOUND, "찾을 수 없는 게임입니다."),
    ;
    private final HttpStatus httpStatus;
    private final ClientExceptionCode clientExceptionCode;
    private final String message;

    ExceptionCode(HttpStatus httpStatus, ClientExceptionCode clientExceptionCode, String message) {
        this.httpStatus = httpStatus;
        this.clientExceptionCode = clientExceptionCode;
        this.message = message;
    }
}
