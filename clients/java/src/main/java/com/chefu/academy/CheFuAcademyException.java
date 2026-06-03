package com.chefu.academy;

public final class CheFuAcademyException extends RuntimeException {
    private final int statusCode;

    public CheFuAcademyException(String message) {
        this(message, 0);
    }

    public CheFuAcademyException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
