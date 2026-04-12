# Booking Feature - Testing Guide

## Overview
The booking feature allows users to book available resources by:
1. Viewing all available resources
2. Selecting a resource and time slot
3. Providing booking details (purpose, attendees)
4. Submitting the booking

## How to Use

### 1. Start the Application
```bash
# Backend (from backend folder)
./mvnw spring-boot:run

# Frontend (from frontend folder)
npm run dev
```

### 2. Test the Booking Feature
- Navigate to the application (default: `http://localhost:5173`)
- You should see the **Booking** tab is active by default
- The booking form will load all available resources from the backend

### 3. Create a Booking
1. **Select a Resource**: Choose from the dropdown list of available resources
   - Resource details (capacity, description) will display below
2. **Set Start Time**: Click on "Start Time" and select when you want to book
3. **Set End Time**: Click on "End Time" (must be after start time)
4. **Add Purpose** (optional): Describe why you need the resource
5. **Add Attendees** (optional): Number of people who will use it
6. **User ID**: For testing, this is set to "1" by default (change if needed)
7. **Click "Book Resource"**: Submit the booking

### 4. View Bookings
Below the form, you'll see all bookings listed as cards showing:
- Resource ID
- User ID
- Start and end times
- Purpose (if provided)
- Expected attendees (if provided)
- Current booking status

### 5. Cancel a Booking
Click the "Cancel" button on any booking card to cancel it.

## API Endpoints Used

### Resources
- `GET /api/resources` - Get all available resources

### Bookings
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/{id}` - Get booking by ID
- `POST /api/bookings/{id}/cancel` - Cancel a booking

## Workflow Diagram

```
┌─────────────────┐
│  Load all       │
│  Resources      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Display in     │
│  Dropdown       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  User Selects   │
│  Resource +     │
│  Time Details   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Submit to      │
│  /api/bookings  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Display in     │
│  Bookings List  │
└─────────────────┘
```

## Testing Checklist

- [ ] Backend is running on `http://localhost:8081`
- [ ] Frontend is running on `http://localhost:5173`
- [ ] At least one resource is created in the system
- [ ] Can see resource in the dropdown
- [ ] Can select dates/times
- [ ] Booking submits successfully
- [ ] New booking appears in the list below
- [ ] Can cancel bookings
- [ ] Proper error messages display

## Troubleshooting

### Resources not loading
- Check if backend is running on port 8081
- Verify resources exist in the database
- Check browser console for CORS errors

### Booking not submitting
- Verify end time is after start time
- Check if user ID exists in the database
- Check backend console for validation errors
- Open browser DevTools Network tab to see API response

### Bookings list not updating
- Try refreshing the page
- Check if booking was actually created (look at backend logs)
- Verify the refresh trigger is working

## Next Steps

Once you confirmed the booking feature is working:
1. Integrate authentication (replace hardcoded user ID)
2. Add booking date conflict detection
3. Add resource availability calendar
4. Add email notifications
5. Add approval workflow


Looking at your current booking system, it covers the basics well, but there's a lot more you could build out. Here's a broader picture of what's possible:

**Enhanced Core Booking**
- Recurring bookings (e.g., every Monday 9–10am for a semester)
- Booking templates for frequently used configurations
- Waitlist system when a resource is already taken
- Minimum/maximum booking duration rules per resource
- Buffer time between bookings (e.g., 15 min cleanup)
- Advance booking limits (e.g., can only book 2 weeks ahead)

**Resource Management**
- Resource categories (labs, meeting rooms, sports courts, equipment)
- Resource images and detailed specs
- Maintenance scheduling that blocks off unavailable times
- Capacity-based booking (partial use of large resources)
- Resource tagging and search/filter

**User & Access Control**
- Role-based access (student, staff, admin, department head)
- Department-specific resource restrictions
- Approval workflows for high-demand or restricted resources
- Booking quotas per user or department (e.g., max 5 bookings/week)
- Faculty priority booking windows

**Scheduling & Availability**
- Visual calendar/timeline view of resource availability
- Conflict detection and smart suggestions
- Real-time availability updates
- Blackout dates (holidays, exams, maintenance windows)
- Operating hours per resource

**Notifications & Communication**
- Email/SMS reminders before bookings
- Cancellation notifications to waitlisted users
- Admin alerts for unusual activity or no-shows
- Booking confirmation receipts

**Check-in & Usage Tracking**
- QR code check-in at the resource location
- No-show detection and automatic release of the slot
- Usage analytics (most booked resources, peak hours, utilization rates)
- Check-out confirmation

**Reporting & Analytics**
- Dashboard for admins showing utilization trends
- Department-level usage reports
- Export data (CSV/PDF) for billing or auditing
- Underutilized resource identification

**Payments & Billing** *(if applicable)*
- Paid bookings for external users or premium resources
- Invoice generation per department
- Refund handling on cancellation

**Integrations**
- Google Calendar / Outlook sync
- University SSO (Single Sign-On) for authentication
- Campus map integration showing resource locations
- IoT sensor integration (room occupancy detection)
- Mobile app support

The next most impactful additions for a campus context are probably **authentication + role-based access**, a **visual calendar view**, **recurring bookings**, and **check-in/no-show handling** — since these directly affect day-to-day usability and fairness. Would you like help designing or implementing any of these?