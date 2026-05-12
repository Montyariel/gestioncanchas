---
name: database-sports-center
description: Design and optimize database schemas for sports center management. Create normalized, scalable data models for courts, bookings, users, payments, and analytics. Includes schema optimization, indexing strategies, and data integrity rules.
license: Complete terms in LICENSE.txt
---

This skill guides database design for sports center applications, ensuring data integrity, query performance, and scalability.

## Core Data Model for Sports Centers

### Users & Authentication
- User profiles (name, email, phone, address)
- Membership tiers (free, bronze, silver, gold, etc.)
- Role management (admin, manager, coach, player)
- Payment methods and billing history
- Preferences (notifications, language, theme)

### Courts & Facilities
- Court information (name, type: football/padel, dimensions, capacity)
- Court amenities (lighting, heating, surveillance, seating)
- Court status tracking (available, occupied, maintenance, closed)
- Maintenance schedule and history
- Court-specific availability rules (hours of operation, blackout dates)

### Bookings & Reservations
- Booking records (user, court, date, time, duration, participants)
- Booking status (pending, confirmed, completed, cancelled, no-show)
- Booking type (single, recurring, team, tournament)
- Cancellation history with refund information
- Participant tracking (attendees, payment responsibility)

### Pricing & Payments
- Price rules (base rate, time slots, member discounts, seasonal rates)
- Transaction records (booking ID, amount, payment method, status)
- Subscription/membership billing cycles
- Invoices and receipts
- Refund tracking and dispute resolution

### Teams & Groups
- Team membership and hierarchy
- Coach/manager assignments
- Team statistics and rankings
- Recurring group bookings
- Team event calendars

### Notifications & Communications
- Booking confirmations and reminders
- System notifications and alerts
- User notification preferences
- Audit log for compliance

## Schema Design Principles

### Normalization vs. Denormalization
- Normalize core transactions (bookings, payments) for data integrity
- Denormalize reporting tables for fast analytics queries
- Use materialized views for complex metrics

### Performance Optimization
- **Indexes**: Create indexes on frequently queried fields
  - Bookings: (court_id, booking_date, status)
  - Users: (email), (phone)
  - Courts: (type, status)
  - Payments: (user_id, created_at)
  
- **Partitioning**: Partition bookings table by date for faster historical queries
- **Archive**: Move old bookings (>2 years) to archive tables
- **Caching**: Cache court availability, user preferences with Redis

### Data Integrity Rules
- Foreign key constraints to maintain referential integrity
- Check constraints for valid values (booking status, court types)
- Unique constraints on critical fields (email, phone)
- Triggers for audit logging and cascading updates
- Transaction consistency for concurrent bookings

## Example Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  name VARCHAR(255) NOT NULL,
  role ENUM('admin', 'manager', 'coach', 'player') DEFAULT 'player',
  membership_tier ENUM('free', 'bronze', 'silver', 'gold') DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Courts table
CREATE TABLE courts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('football', 'padel') NOT NULL,
  capacity INT NOT NULL,
  location VARCHAR(255),
  status ENUM('available', 'occupied', 'maintenance', 'closed') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table (partitioned by date)
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL REFERENCES users(id),
  court_id INT NOT NULL REFERENCES courts(id),
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  num_participants INT NOT NULL,
  status ENUM('pending', 'confirmed', 'completed', 'cancelled', 'no-show') DEFAULT 'pending',
  total_price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(court_id, booking_date, start_time)
) PARTITION BY RANGE (booking_date);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  booking_id INT NOT NULL REFERENCES bookings(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  payment_method VARCHAR(50),
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  transaction_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manager_id INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team members junction table
CREATE TABLE team_members (
  id SERIAL PRIMARY KEY,
  team_id INT NOT NULL REFERENCES teams(id),
  user_id INT NOT NULL REFERENCES users(id),
  role ENUM('manager', 'coach', 'player') DEFAULT 'player',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(team_id, user_id)
);
```

## Query Optimization Strategies

### Critical Queries to Optimize
1. **Get available time slots for a court on a specific date**
   - Index: (court_id, booking_date, status)
   - Cache results in Redis (5-minute expiry)

2. **Get user's upcoming bookings**
   - Index: (user_id, booking_date)
   - Pagination for large result sets

3. **Get revenue reports by time period**
   - Materialized view for daily/monthly summaries
   - Run updates nightly during low-traffic hours

4. **Get occupancy rates by court**
   - Denormalized occupancy table updated hourly
   - Quick aggregation without scanning all bookings

## Data Integrity & Validation

- **Booking Conflicts**: Prevent overlapping bookings on same court
- **User Verification**: Email/phone validation, duplicate account prevention
- **Payment Reconciliation**: Ensure every booking has a payment record
- **Audit Trail**: Track all modifications to critical data
- **Data Consistency**: Validate date/time constraints, capacity limits

## Backup & Recovery

- Daily incremental backups
- Weekly full backups
- Point-in-time recovery capability (30-day minimum)
- Backup testing and documentation
- Disaster recovery plan

## Security Considerations

- Encrypt sensitive data (payment info, phone numbers)
- Row-level security for user-specific data
- Mask sensitive data in logs
- Regular security audits
- GDPR/CCPA compliance for user data

## DO NOT

- Use generic UUIDs without understanding cardinality impact
- Skip indexes on frequently filtered columns
- Neglect data validation (trust user input)
- Design without considering query performance from day one
- Forget to plan for data growth and archival
- Store passwords in plain text or weak hashing

Create databases that scale with the business while maintaining data integrity and query performance.
