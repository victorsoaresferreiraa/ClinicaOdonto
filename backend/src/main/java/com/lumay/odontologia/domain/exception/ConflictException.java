package com.lumay.odontologia.domain.exception;
public class ConflictException extends BusinessException {
    public ConflictException(String message) { super(message, 409); }
}
