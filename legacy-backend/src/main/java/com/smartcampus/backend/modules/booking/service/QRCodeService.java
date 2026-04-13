package com.smartcampus.backend.modules.booking.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.util.Base64;

/**
 * Service for generating QR codes in Base64 format
 * Used for booking check-in functionality
 */
@Service
public class QRCodeService {

    /**
     * Generate a QR code in Base64 format
     * 
     * @param bookingId The booking ID to encode in the QR code
     * @return Base64 encoded PNG image of the QR code
     * @throws Exception if QR code generation fails
     */
    public String generateQRCodeBase64(String bookingId) throws Exception {
        String content = "BOOKING:" + bookingId;

        MultiFormatWriter writer = new MultiFormatWriter();
        // Increased size to 400x400 for better scannability
        BitMatrix bitMatrix = writer.encode(content, BarcodeFormat.QR_CODE, 400, 400);

        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", outputStream);
        byte[] bytes = outputStream.toByteArray();

        return Base64.getEncoder().encodeToString(bytes);
    }
}
