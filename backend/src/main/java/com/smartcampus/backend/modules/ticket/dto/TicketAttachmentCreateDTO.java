//Used for adding attachments to maintenance tickets.
package com.smartcampus.backend.modules.ticket.dto;

public class TicketAttachmentCreateDTO {

    private Long ticketId;
    private String fileName;
    private String fileUrl;
    private String fileType;
    private Long fileSize;

    // Constructors
    public TicketAttachmentCreateDTO() {}

    public TicketAttachmentCreateDTO(Long ticketId, String fileName, String fileUrl,
                                     String fileType, Long fileSize) {
        this.ticketId = ticketId;
        this.fileName = fileName;
        this.fileUrl = fileUrl;
        this.fileType = fileType;
        this.fileSize = fileSize;
    }

    // Getters and Setters
    public Long getTicketId() {
        return ticketId;
    }

    public void setTicketId(Long ticketId) {
        this.ticketId = ticketId;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }

    public String getFileUrl() {
        return fileUrl;
    }

    public void setFileUrl(String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public String getFileType() {
        return fileType;
    }

    public void setFileType(String fileType) {
        this.fileType = fileType;
    }

    public Long getFileSize() {
        return fileSize;
    }

    public void setFileSize(Long fileSize) {
        this.fileSize = fileSize;
    }
}
