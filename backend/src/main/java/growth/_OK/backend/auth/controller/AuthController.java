package growth._OK.backend.auth.controller;

import org.springframework.stereotype.Controller;

import growth._OK.backend.global.exception.CapstonException;
import growth._OK.backend.global.exception.ExceptionCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class AuthController {
    @GetMapping("/test/error")
    public String throwError() {
        throw new CapstonException(ExceptionCode.AUTH_TOKEN_EMPTY);
    }
}