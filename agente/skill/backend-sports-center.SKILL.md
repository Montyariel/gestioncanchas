---
name: backend-sports-center
description: Build robust backend systems for sports center management. Design APIs for bookings, payment processing, user management, court availability, scheduling logic, and reporting. Handles database architecture, authentication, and real-time synchronization.
license: Complete terms in LICENSE.txt
---

This skill guides development of scalable, reliable backend systems for sports center management applications serving football and padel courts.

## Sports Center Backend Requirements

The backend must handle:
- **Booking System**: Court reservations, time slot management, recurring bookings, cancellations
- **User Management**: Authentication, roles (admin, manager, coach, player), membership tiers
- **Court & Resource Management**: Court status, maintenance scheduling, equipment tracking
- **Payment Processing**: Transaction handling, subscription billing, invoice generation
- **Availability & Scheduling**: Real-time court availability, conflict detection, automated notifications
- **Analytics & Reporting**: Usage statistics, revenue tracking, occupancy analysis, player metrics
- **Integration Needs**: Payment gateways, notification services (SMS/email), calendar systems

## Architecture Principles

Design with:
- **Scalability**: Handle concurrent bookings, real-time updates for multiple courts
- **Reliability**: Ensure booking data integrity, prevent double-bookings, maintain audit trails
- **Performance**: Fast query responses for availability checks (critical for user experience)
- **Security**: PCI compliance for payments, user data protection, role-based access control
- **Real-Time Sync**: WebSocket or polling for live court status updates across devices

## Database Design Considerations

Key entities:
- **Users**: Player profiles, membership status, payment methods
- **Courts**: Court identifiers, dimensions, amenities, maintenance schedules
- **Bookings**: Reservations with time slots, participants, pricing, status
- **Transactions**: Payment records, subscription history, refunds
- **Teams/Groups**: Team management, recurring group bookings
- **Availability Rules**: Court schedules, operating hours, blackout periods

Optimize for:
- Quick availability queries (must be sub-100ms)
- Conflict detection (prevent overlapping bookings)
- Historical data tracking (audit trail for disputes)

## API Design Standards

RESTful or GraphQL APIs should support:
- **Booking Endpoints**: Create, read, update, cancel reservations
- **Availability Endpoints**: Real-time court status, time slot availability
- **User Management**: Registration, profile updates, membership management
- **Payments**: Transaction processing, refund handling, invoice retrieval
- **Admin Functions**: Court management, reporting, user administration
- **Notifications**: Booking confirmations, reminders, team invitations

Include:
- Proper authentication (JWT tokens, OAuth2 for social login)
- Rate limiting to prevent abuse
- Comprehensive error handling with meaningful messages
- API versioning for backward compatibility
- Detailed logging for debugging and compliance

## Key Business Logic

Implement:
- **Dynamic Pricing**: Time-based pricing, member discounts, peak-hour rates
- **Recurring Bookings**: Automatic weekly/monthly reservations with modification support
- **Notification Workflows**: Booking confirmations, cancellation notices, payment reminders
- **Occupancy Rules**: Team size restrictions, court capacity limits
- **Cancellation Policies**: Time-based refunds, no-show penalties
- **Reporting Automation**: Daily/weekly summaries for managers

## Technology Recommendations

- **Framework**: Node.js/Express, Python/FastAPI, Go, or similar
- **Database**: PostgreSQL (proven reliability) or MongoDB (flexible schema)
- **Real-Time**: Socket.io, WebSockets, or Server-Sent Events
- **Payment**: Stripe, PayPal, or local payment gateways
- **Caching**: Redis for availability data and session management
- **Queue System**: RabbitMQ or Redis for async tasks (notifications, invoicing)

## Testing & Quality

- Unit tests for booking logic, payment processing
- Integration tests for end-to-end booking flows
- Load testing for concurrent booking scenarios
- Database transaction testing for consistency

## DO NOT

- Design without considering concurrency (bookings happen simultaneously)
- Neglect payment security and compliance requirements
- Build synchronous payment processing (always async with webhooks)
- Forget audit trails for dispute resolution
- Ignore timezone handling for distributed users
- Create bottlenecks in availability queries

Build backends that are as responsive as the sports centers they serve.
