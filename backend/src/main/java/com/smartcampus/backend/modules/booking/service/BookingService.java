package com.smartcampus.backend.modules.booking.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.smartcampus.backend.modules.booking.entity.Booking;
import com.smartcampus.backend.modules.booking.repository.BookingRepository;

@Service
public class BookingService {
    
    @Autowired
    private BookingRepository bookingRepository;
    
    public Booking createBooking(Booking booking) {
        booking.setStatus("PENDING");
        return bookingRepository.save(booking);
    }
    
    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }
    
    public Booking getBookingById(Long id) {
        return bookingRepository.findById(id).orElse(null);
    }
    
    public Booking updateBooking(Long id, Booking booking) {
        booking.setId(id);
        return bookingRepository.save(booking);
    }
    
    public void deleteBooking(Long id) {
        bookingRepository.deleteById(id);
    }
}
