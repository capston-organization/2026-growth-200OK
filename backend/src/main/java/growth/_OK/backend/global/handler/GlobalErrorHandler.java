package growth._OK.backend.global.handler;

import growth._OK.backend.global.dto.ExceptionResponse;
import growth._OK.backend.global.exception.CapstonException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.ZonedDateTime;

@Slf4j
@RestControllerAdvice
public class GlobalErrorHandler {

    @ExceptionHandler(CapstonException.class)
    public ResponseEntity<ExceptionResponse> handleAimException(CapstonException e, HttpServletRequest request) {
        ExceptionResponse response = new ExceptionResponse(
                e.getHttpStatusCode().value(),
                e.getExceptionCodeName(),
                e.getMessage(),
                request.getRequestURI(), ZonedDateTime.now()
        );
        return ResponseEntity.status(e.getHttpStatusCode())
                .body(response);
    }
}