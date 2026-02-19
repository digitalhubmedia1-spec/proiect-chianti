# Tasks

- [ ] Task 1: Database Schema & Setup
  - [ ] SubTask 1.1: Create SQL migration file `create_reservations_schema.sql` (reservations table, locks table, update events table).
  - [ ] SubTask 1.2: Apply migration (instructions for user).
  - [ ] SubTask 1.3: Update Supabase types/definitions if needed.

- [ ] Task 2: Admin Link Generation
  - [ ] SubTask 2.1: Update `EventGeneral.jsx` (or similar) to include "Genereaza link rezervare" button.
  - [ ] SubTask 2.2: Implement logic to generate/fetch token and display full URL.

- [ ] Task 3: Public Reservation Page (Layout & Routing)
  - [ ] SubTask 3.1: Create new route `/rezervare/:token` in `App.jsx`.
  - [ ] SubTask 3.2: Create `ReservationPage.jsx` component.
  - [ ] SubTask 3.3: Implement fetching event details by token.
  - [ ] SubTask 3.4: Display event info and basic layout structure.

- [ ] Task 4: Visual Seat Selection (Public)
  - [ ] SubTask 4.1: Create `VisualHallViewer` component (based on `VisualHallEditor` but read-only).
  - [ ] SubTask 4.2: Implement logic to color tables based on reservation status (Green/Red/Yellow).
  - [ ] SubTask 4.3: Implement seat selection logic (click to select, input seat count 1-10).

- [ ] Task 5: Reservation Logic & Form
  - [ ] SubTask 5.1: Create reservation form (Name, Phone).
  - [ ] SubTask 5.2: Implement form validation (Romanian phone format).
  - [ ] SubTask 5.3: Implement submission logic (insert into `event_reservations`).
  - [ ] SubTask 5.4: Implement success confirmation screen.

- [ ] Task 6: Real-time Locking & Concurrency
  - [ ] SubTask 6.1: Implement locking mechanism (insert into `event_reservation_locks`).
  - [ ] SubTask 6.2: Implement auto-release lock after 5 mins.
  - [ ] SubTask 6.3: Use Supabase Realtime to update availability on other clients.

- [ ] Task 7: Admin Reservations Management
  - [ ] SubTask 7.1: Create `EventReservations.jsx` component for the admin dashboard tab.
  - [ ] SubTask 7.2: Implement table with columns: Date, Name, Phone, Table, Seats, Status.
  - [ ] SubTask 7.3: Add search and filter functionality.
  - [ ] SubTask 7.4: Implement export to CSV/Excel.
  - [ ] SubTask 7.5: Add stats summary (Total seats, Occupancy %).

# Task Dependencies
- Task 3 depends on Task 1 & 2.
- Task 4 depends on Task 3.
- Task 5 depends on Task 4.
- Task 6 depends on Task 5 (can be parallelized but easier sequential).
- Task 7 depends on Task 1.
