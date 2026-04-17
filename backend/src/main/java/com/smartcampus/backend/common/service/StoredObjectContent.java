package com.smartcampus.backend.common.service;

public record StoredObjectContent(byte[] content, String contentType, long contentLength) {}
