package com.lumay.odontologia.domain.exception;
public class ResourceNotFoundException extends BusinessException {
    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " com ID " + id + " não encontrado.", 404);
    }
    public ResourceNotFoundException(String message) { super(message, 404); }
}
