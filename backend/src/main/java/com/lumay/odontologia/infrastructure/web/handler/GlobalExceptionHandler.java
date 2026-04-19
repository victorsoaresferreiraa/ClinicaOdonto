package com.lumay.odontologia.infrastructure.web.handler;
import com.lumay.odontologia.domain.exception.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;
import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@Slf4j @RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
    private static final String BASE = "https://lumayodontologia.com.br/errors";

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        log.warn("Not found: {}", ex.getMessage());
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        p.setTitle("Recurso não encontrado"); p.setType(URI.create(BASE+"/not-found")); p.setProperty("timestamp", Instant.now()); return p;
    }

    @ExceptionHandler(ConflictException.class)
    public ProblemDetail handleConflict(ConflictException ex) {
        log.warn("Conflict: {}", ex.getMessage());
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        p.setTitle("Conflito"); p.setType(URI.create(BASE+"/conflict")); p.setProperty("timestamp", Instant.now()); return p;
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ProblemDetail> handleBusiness(BusinessException ex) {
        log.warn("Business: {}", ex.getMessage());
        HttpStatus status = HttpStatus.resolve(ex.getStatusCode());
        if (status == null) status = HttpStatus.BAD_REQUEST;
        ProblemDetail p = ProblemDetail.forStatusAndDetail(status, ex.getMessage());
        p.setTitle("Erro de negócio"); p.setType(URI.create(BASE+"/business")); p.setProperty("timestamp", Instant.now());
        return ResponseEntity.status(status).body(p);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException ex, HttpHeaders headers, HttpStatusCode status, WebRequest req) {
        Map<String,String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(e -> errors.put(((FieldError)e).getField(), e.getDefaultMessage()));
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, "Dados inválidos.");
        p.setTitle("Validação falhou"); p.setType(URI.create(BASE+"/validation")); p.setProperty("errors", errors); p.setProperty("timestamp", Instant.now());
        return ResponseEntity.unprocessableEntity().body(p);
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleAll(Exception ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        ProblemDetail p = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Erro interno. Tente novamente.");
        p.setTitle("Erro interno"); p.setType(URI.create(BASE+"/internal")); p.setProperty("timestamp", Instant.now()); return p;
    }
}
