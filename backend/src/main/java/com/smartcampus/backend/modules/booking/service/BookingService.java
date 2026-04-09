//handles the business logic for managing bookings.
package com.smartcampus.backend.modules.booking.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.smartcampus.backend.modules.booking.dto.BookingCreateDTO;
import com.smartcampus.backend.modules.booking.dto.BookingUpdateDTO;
import com.smartcampus.backend.modules.booking.entity.Booking;
import com.smartcampus.backend.modules.booking.repository.BookingRepository;
import com.smartcampus.backend.common.entity.Resource;
import com.smartcampus.backend.common.entity.User;
import com.smartcampus.backend.common.repository.UserRepository;

@Service
public class BookingService {
    
    @Autowired
    private BookingRepository bookingRepository;
    
    @Autowired
    private UserRepository userRepository;

    @Autowired
    private QRCodeService qrCodeService;
    
    /**
     * Create a new booking
     * Validates time slot availability and business rules
     */
    public Booking addBooking(BookingCreateDTO bookingDTO) {
        // Validation checks
        validateBookingTime(bookingDTO.getStartTime(), bookingDTO.getEndTime());
        validateResourceAvailability(bookingDTO.getResourceId(), 
                                    bookingDTO.getStartTime(), 
                                    bookingDTO.getEndTime());
        
        Booking booking = new Booking();
        booking.setStatus("PENDING");
        booking.setStartTime(bookingDTO.getStartTime());
        booking.setEndTime(bookingDTO.getEndTime());
        booking.setPurpose(bookingDTO.getPurpose());
        booking.setExpectedAttendees(bookingDTO.getExpectedAttendees());
        
        // Set resource and user
        if (bookingDTO.getResourceId() != null) {
            Resource resource = new Resource();
            resource.setId(bookingDTO.getResourceId());
            booking.setResource(resource);
        }
        
        if (bookingDTO.getUserId() != null) {
            User user = new User();
            user.setUserId(bookingDTO.getUserId());
            booking.setUser(user);
        }
        
        // Save booking first to get the ID
        booking = bookingRepository.save(booking);
        
        // Generate QR code after saving to get the booking ID
        try {
            String qrCodeBase64 = qrCodeService.generateQRCodeBase64(String.valueOf(booking.getId()));
            booking.setQrCodeBase64(qrCodeBase64);
            booking = bookingRepository.save(booking);
        } catch (Exception e) {
            // Log the error but don't fail the booking creation
            System.err.println("Failed to generate QR code for booking " + booking.getId() + ": " + e.getMessage());
        }
        
        return booking;
    }

    /**
     * Approve a pending booking. Ensures no approved conflicts exist.
     */
    @Transactional
    public Booking approveBooking(Long id, String approvalReason) {
        Optional<Booking> existingBooking = bookingRepository.findById(id);

        if (!existingBooking.isPresent()) {
            throw new RuntimeException("Booking not found with id: " + id);
        }

        Booking booking = existingBooking.get();

        if (!"PENDING".equals(booking.getStatus())) {
            throw new RuntimeException("Only pending bookings can be approved");
        }

        if (booking.getResource() == null || booking.getResource().getId() == null) {
            throw new RuntimeException("Booking has no associated resource");
        }

        // Ensure resource is still available for this time range (exclude this booking)
        validateResourceAvailability(booking.getResource().getId(), booking.getStartTime(), booking.getEndTime(), id);

        booking.setStatus("APPROVED");
        booking.setApprovalReason(approvalReason);
        
        // Generate QR code for approved booking
        try {
            String qrCodeBase64 = qrCodeService.generateQRCodeBase64(String.valueOf(booking.getId()));
            booking.setQrCodeBase64(qrCodeBase64);
        } catch (Exception e) {
            // Log error but don't fail the approval
            System.err.println("Failed to generate QR code: " + e.getMessage());
        }

        return bookingRepository.save(booking);
    }

    /**
     * Reject a pending booking.
     */
    @Transactional
    public Booking rejectBooking(Long id, String reason) {
        Optional<Booking> existingBooking = bookingRepository.findById(id);

        if (!existingBooking.isPresent()) {
            throw new RuntimeException("Booking not found with id: " + id);
        }

        Booking booking = existingBooking.get();

        if (!"PENDING".equals(booking.getStatus())) {
            throw new RuntimeException("Only pending bookings can be rejected");
        }

        booking.setStatus("REJECTED");
        booking.setApprovalReason(reason);

        return bookingRepository.save(booking);
    }
    
    /**
     * Update an existing booking
     * Allows updates only for PENDING bookings
     */
    public Booking updateBooking(Long id, BookingUpdateDTO updateDTO) {
        Optional<Booking> existingBooking = bookingRepository.findById(id);
        
        if (!existingBooking.isPresent()) {
            throw new RuntimeException("Booking not found with id: " + id);
        }
        
        Booking booking = existingBooking.get();
        
        // Prevent updates on cancelled or approved bookings
        if ("CANCELLED".equals(booking.getStatus()) || "APPROVED".equals(booking.getStatus())) {
            throw new RuntimeException("Cannot update booking with status: " + booking.getStatus());
        }
        
        // Validate new time slot if times are being updated
        if (updateDTO.getStartTime() != null && updateDTO.getEndTime() != null) {
            validateBookingTime(updateDTO.getStartTime(), updateDTO.getEndTime());
            validateResourceAvailability(booking.getResource().getId(), 
                                       updateDTO.getStartTime(), 
                                       updateDTO.getEndTime(), 
                                       id); // Exclude current booking from conflict check
            booking.setStartTime(updateDTO.getStartTime());
            booking.setEndTime(updateDTO.getEndTime());
        }
        
        if (updateDTO.getPurpose() != null) {
            booking.setPurpose(updateDTO.getPurpose());
        }
        
        if (updateDTO.getExpectedAttendees() != null) {
            booking.setExpectedAttendees(updateDTO.getExpectedAttendees());
        }
        
        // Status update (typically done through approve/reject endpoints)
        if (updateDTO.getStatus() != null && "PENDING".equals(booking.getStatus())) {
            booking.setStatus(updateDTO.getStatus());
        }
        
        return bookingRepository.save(booking);
    }
    
    /**
     * Cancel a booking
     * Changes status to CANCELLED and stores cancellation reason
     */
    public Booking cancelBooking(Long id, String cancellationReason) {
        Optional<Booking> existingBooking = bookingRepository.findById(id);
        
        if (!existingBooking.isPresent()) {
            throw new RuntimeException("Booking not found with id: " + id);
        }
        
        Booking booking = existingBooking.get();
        
        // Prevent cancellation of already cancelled bookings
        if ("CANCELLED".equals(booking.getStatus())) {
            throw new RuntimeException("Booking is already cancelled");
        }
        
        booking.setStatus("CANCELLED");
        booking.setApprovalReason(cancellationReason);
        
        return bookingRepository.save(booking);
    }
    
    /**
     * Get all bookings
     */
    /**
     * Get all bookings
     */
    @Transactional
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
    
    /**
     * Get booking by ID
     */
    @Transactional
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Booking not found with id: " + id));
    }
    
    /**
     * Get bookings by user
     */
    @Transactional
    public List<Booking> getBookingsByUser(Long userId) {
        return bookingRepository.findByUser_UserId(userId);
    }
    
    /**
     * Get bookings by resource
    @Transactional
     */
    public List<Booking> getBookingsByResource(Long resourceId) {
        return bookingRepository.findByResource_Id(resourceId);
    }
    
    /**
     * Get pending bookings for a resource
    @Transactional
     */
    public List<Booking> getPendingBookingsByResource(Long resourceId) {
        return bookingRepository.findByResource_IdAndStatus(resourceId, "PENDING");
    }
    
    /**
     * Delete a booking (soft delete - consider using status instead)
     */
    public void deleteBooking(Long id) {
        if (!bookingRepository.existsById(id)) {
            throw new RuntimeException("Booking not found with id: " + id);
        }
        bookingRepository.deleteById(id);
    }
    
    /**
     * Check in a booking via QR code
     * Marks the booking as checked in and records the check-in time
     */
    public Booking checkInBooking(Long id) {
        Optional<Booking> existingBooking = bookingRepository.findById(id);
        
        if (!existingBooking.isPresent()) {
            throw new RuntimeException("Booking not found with id: " + id);
        }
        
        Booking booking = existingBooking.get();
        
        if (booking.isCheckedIn()) {
            throw new RuntimeException("Booking is already checked in");
        }
        
        booking.setCheckedIn(true);
        booking.setCheckInTime(LocalDateTime.now());
        
        return bookingRepository.save(booking);
    }
    
    // ============ Helper Methods ============
    
    /**
     * Validate booking time constraints
     */
    private void validateBookingTime(LocalDateTime startTime, LocalDateTime endTime) {
        if (startTime == null || endTime == null) {
            throw new RuntimeException("Start time and end time are required");
        }
        
        if (startTime.isAfter(endTime)) {
            throw new RuntimeException("Start time must be before end time");
        }
        
        if (startTime.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot book for past dates");
        }
        
        // Check minimum booking duration (e.g., 30 minutes)
        if (startTime.plusMinutes(30).isAfter(endTime)) {
            throw new RuntimeException("Booking duration must be at least 30 minutes");
        }
    }
    
    /**
     * Validate resource availability
     */
    private void validateResourceAvailability(Long resourceId, LocalDateTime startTime, LocalDateTime endTime) {
        validateResourceAvailability(resourceId, startTime, endTime, null);
    }
    
    /**
     * Validate resource availability (excluding a specific booking ID)
     */
    private void validateResourceAvailability(Long resourceId, LocalDateTime startTime, 
                                             LocalDateTime endTime, Long excludeBookingId) {
        List<Booking> conflictingBookings = bookingRepository
                .findByResourceIdAndStatusAndTimeRange(resourceId, "APPROVED", startTime, endTime);
        
        // Filter out the current booking if updating
        if (excludeBookingId != null) {
            conflictingBookings.removeIf(b -> b.getId().equals(excludeBookingId));
        }
        
        if (!conflictingBookings.isEmpty()) {
            throw new RuntimeException("Resource is not available for the selected time range");
        }
    }
}
