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
    PROBLEM_NOT_FOUND(HttpStatus.NOT_FOUND, ClientExceptionCode.PROBLEM_NOT_FOUND, "찾을 수 없는 문제입니다."),
    GAME_SOURCE_NOT_FOUND(HttpStatus.NOT_FOUND, ClientExceptionCode.GAME_SOURCE_NOT_FOUND, "찾을 수 없는 소스입니다."),
    GAME_SOURCE_NOT_SET(HttpStatus.BAD_REQUEST, ClientExceptionCode.GAME_SOURCE_NOT_SET, "해당 게임에 연결된 소스가 없습니다. 게임 생성 시 sourceId를 지정해 주세요."),
    INVALID_SOURCE_FILE(HttpStatus.BAD_REQUEST, ClientExceptionCode.INVALID_SOURCE_FILE, "PDF 또는 텍스트 파일만 업로드 가능합니다."),

    // AI (Gemini)
    GEMINI_QUOTA_EXCEEDED(HttpStatus.TOO_MANY_REQUESTS, ClientExceptionCode.GEMINI_QUOTA_EXCEEDED, "AI 생성 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요."),
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
