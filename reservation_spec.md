# Event Reservation System Spec

## Why
To enable online reservations for events, automating seat allocation and guest management, and providing a seamless experience for both administrators and customers.

## What Changes
- **Database**:
  - New table `event_reservations` to store guest bookings.
  - New table `event_reservation_locks` to handle temporary seat holding.
  - Update `events` table to store a unique public token (`reservation_token`) for the reservation link.
- **Admin Panel**:
  - Add "Generate Reservation Link" button in `EventGeneral` (or `AdminEventDetail`).
  - Add a new "Rezervări" tab in `AdminEventDetail` for reporting and management.
- **Public Interface**:
  - Create a new public route `/rezervare/:token` for the reservation page.
  - Implement a visual seat selection interface reusing the existing hall layout logic but in read-only mode with availability indicators.
  - Implement a reservation form (Name, Phone, Seat Count).
- **Backend Logic**:
  - Implement real-time seat locking (5 minutes) using Supabase.
  - Implement validation to prevent overbooking.

## Impact
- **Affected Specs**: Event Management.
- **Affected Code**: 
  - `src/pages/admin/AdminEventDetail.jsx` (New tab)
  - `src/pages/admin/components/EventReservations.jsx` (New component)
  - `src/pages/public/ReservationPage.jsx` (New page)
  - `src/App.jsx` (New route)
  - Database schema (Supabase).

## ADDED Requirements

### Requirement: Admin Link Generation
The system SHALL provide a button in the event admin panel to generate a unique, shareable URL for public reservations (e.g., `/rezervare/:token`).
- **Scenario: Generate Link**
  - **WHEN** admin clicks "Genereaza link rezervare"
  - **THEN** a unique token is generated (if not exists) and saved to the event, and the full URL is displayed for copying.

### Requirement: Public Reservation Page
The system SHALL provide a responsive, mobile-friendly public page for reservations.
- **Details**: Display event date, time, description.
- **Visual Layout**: Show restaurant schema with tables.
  - Green indicator: Available.
  - Red indicator: Fully booked.
  - Yellow/Orange: Partially occupied (if applicable).
- **Seat Selection**: User can select a table and specify the number of seats (1-10).
- **Form**: Fields for Name, Surname, Phone (Romanian format validation).
- **Confirmation**: On success, show a confirmation message.

### Requirement: Real-time Seat Management
The system SHALL prevent overbooking and handle concurrent users.
- **Locking**: When a user selects seats, they are temporarily locked for 5 minutes.
- **Validation**: Server-side validation to ensure seats are still available before confirming.
- **Updates**: Automatic availability updates (using Supabase Realtime).

### Requirement: Admin Reporting
The system SHALL provide a "Rezervări" tab in the event dashboard.
- **Table**: Columns for Date, Name, Phone, Table, Seats, Status.
- **Features**: Sortable, Search by name, Filter by table/status.
- **Export**: Button to export data to CSV/Excel.
- **Stats**: Total reserved seats, occupancy percentage.

### Requirement: Technical Stack Adaptation
**Note**: The user requested PHP/MySQL, but the current project is **React + Supabase**. This feature will be implemented using the **existing React + Supabase stack** to ensure compatibility and maintainability.
- **Frontend**: React (Vite).
- **Backend**: Supabase (PostgreSQL, Realtime).

## MODIFIED Requirements
### Requirement: Event Dashboard
The `AdminEventDetail` will be modified to include the new "Rezervări" tab.
