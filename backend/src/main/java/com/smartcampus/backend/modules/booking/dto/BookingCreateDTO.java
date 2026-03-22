//Used for creating new bookings.
package com.smartcampus.backend.modules.booking.dto;

import java.time.LocalDateTime;

public class BookingCreateDTO {
    
    private Long resourceId;
    private Long userId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String purpose;
    private Integer expectedAttendees;
    
    // Constructors
    public BookingCreateDTO() {}
    
    public BookingCreateDTO(Long resourceId, Long userId, LocalDateTime startTime, 
                           LocalDateTime endTime, String purpose, Integer expectedAttendees) {
        this.resourceId = resourceId;
        this.userId = userId;
        this.startTime = startTime;
        this.endTime = endTime;
        this.purpose = purpose;
        this.expectedAttendees = expectedAttendees;
    }
    
    // Getters and Setters
    public Long getResourceId() {
        return resourceId;
    }
    
    public void setResourceId(Long resourceId) {
        this.resourceId = resourceId;
    }
    
    public Long getUserId() {
        return userId;
    }
    
    public void setUserId(Long userId) {
        this.userId = userId;
    }
    
    public LocalDateTime getStartTime() {
        return startTime;
    }
    
    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }
    
    public LocalDateTime getEndTime() {
        return endTime;
    }
    
    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }
    
    public String getPurpose() {
        return purpose;
    }
    
    public void setPurpose(String purpose) {
        this.purpose = purpose;
    }
    
    public Integer getExpectedAttendees() {
        return expectedAttendees;
    }
    
    public void setExpectedAttendees(Integer expectedAttendees) {
        this.expectedAttendees = expectedAttendees;
    }
}
