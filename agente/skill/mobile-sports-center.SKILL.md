---
name: mobile-sports-center
description: Build responsive, high-performance mobile apps for sports center management. Create native or cross-platform apps for iOS/Android with offline capabilities, real-time notifications, and field-optimized interfaces for court-side usage.
license: Complete terms in LICENSE.txt
---

This skill guides development of mobile applications specifically designed for sports center users (athletes, coaches, managers) who need instant access to booking, scheduling, and facility information.

## Mobile App Strategy for Sports Centers

Sports center users access the app:
- **Before arrival**: Book courts, check availability, make payments
- **On-site**: Check team schedules, confirm bookings, coordinate with players
- **During activity**: Timer for match duration, score tracking (optional)
- **After activity**: Payment confirmation, rating/feedback, next booking

Design must support rapid interactions in high-energy environments.

## Platform Considerations

### Choose Your Approach:
- **React Native**: Single codebase for iOS/Android, faster development
- **Flutter**: Excellent performance, growing ecosystem
- **Native (Swift/Kotlin)**: Maximum control, best performance, separate codebases
- **Progressive Web App (PWA)**: Browser-based, works offline with service workers

For sports centers: **React Native or Flutter** recommended for rapid cross-platform deployment.

## Essential Mobile Features

### Real-Time Notifications
- Booking confirmations and reminders (15 min before, 24h before)
- Team invitations and cancellations
- Court availability alerts (notify when preferred court opens)
- Promotion/special offers
- Payment reminders

### Offline Capabilities
- Cache recently viewed courts and availability
- Store draft bookings locally
- Sync when connection restored
- Clearly indicate offline status

### Geolocation Features
- Map display of sports centers
- Directions/navigation to facility
- Location-based court suggestions
- Check-in when arriving (optional)

### Camera & Media
- QR code scanning for quick check-in
- Photo capture for proof of booking
- Receipt/invoice viewing and sharing
- Team photo gallery

### Performance Requirements
- App launch: <2 seconds
- Availability query response: <1 second
- Booking completion: <3 seconds total
- Smooth 60 FPS animations
- Minimal battery drain

## Mobile UI/UX Principles for Sports

### Navigation Structure
- **Tab Navigation** (4-5 main sections):
  1. Home/Dashboard (upcoming bookings, quick actions)
  2. Browse/Search (find courts, check availability)
  3. My Bookings (current and past reservations)
  4. Teams (group management, team info)
  5. Account (profile, settings, payment methods)

### Quick Actions (Priority One)
- One-tap booking for recurring reservation
- Quick court availability check
- Fast payment setup
- Team booking (group selection)

### Information Architecture
- **Minimize taps**: Max 2-3 taps to complete any common action
- **Visual hierarchy**: Large, scannable information
- **Readable fonts**: 14pt+ minimum body text
- **High contrast**: Support outdoor/bright light viewing
- **Clear CTAs**: Prominent action buttons

### Touch-Friendly Design
- Buttons/taps: Minimum 48x48pt (iOS) / 48x48dp (Android)
- Spacing: Adequate padding between interactive elements
- Gestures: Swipe for navigation, long-press for options
- Haptic feedback: Vibration on successful actions

## Component Library

Essential mobile components:
- **Booking Calendar**: Date picker with real-time availability
- **Time Slot Selector**: Visual grid showing available/occupied slots
- **Court Card**: Display court info, amenities, availability, rating
- **Payment Form**: PCI-compliant card entry or saved payment selection
- **Booking Confirmation**: Clear summary with all details and cancellation terms
- **Notification Center**: Consolidated alerts with clear actions
- **Team Roster**: Quick access to team members, roles, contact
- **Occupancy/Score Widget**: Real-time match info (if applicable)

## Backend Integration for Mobile

### API Endpoints for Mobile
- Optimized for bandwidth and battery
- Compression for large responses
- Pagination for lists
- Only essential fields (remove unnecessary data)
- Request batching to reduce API calls

### Data Caching Strategy
- Local SQLite or Realm database for persistence
- Redux/Zustand for state management
- Regular sync with server (every 5-15 minutes)
- Conflict resolution for offline modifications
- Cache invalidation rules

### Real-Time Sync
- WebSocket connection for live updates
- Fallback to polling if WebSocket unavailable
- Listen for:
  - Court availability changes
  - Booking status updates
  - Team notifications
  - Payment confirmations

## Platform-Specific Guidance

### iOS (React Native/Swift)
- Respect iOS design guidelines (Human Interface Guidelines)
- Safe area handling for notch/Dynamic Island
- Push notification setup with Apple Push Notification service
- App Store publishing requirements (privacy policy, permissions)
- Dark mode support

### Android (React Native/Kotlin)
- Material Design 3 compliance
- System navigation gestures
- Firebase Cloud Messaging for push notifications
- Google Play Store requirements
- Accessibility with TalkBack support

## Security for Mobile Apps

- Secure credential storage (Keychain/Keystore)
- SSL/TLS pinning to prevent man-in-the-middle attacks
- Biometric authentication (Face ID, fingerprint)
- Token-based auth with refresh token rotation
- No sensitive data in logs or crash reports
- Regular security updates and patch management

## Testing for Mobile

- Unit tests for business logic
- Integration tests for API communication
- UI tests for critical user flows (booking, payment)
- Performance testing (battery, memory, network)
- Usability testing with real athletes/coaches
- A/B testing for feature adoption

## Analytics & Monitoring

Track:
- App crashes and errors
- Feature usage (most booked courts, popular times)
- User retention and engagement
- Booking conversion rates
- Performance metrics (load times, API latency)

## Deployment & Updates

- CI/CD pipeline for automated testing and deployment
- Staged rollouts (10% → 50% → 100% of users)
- Feature flags for gradual feature activation
- Over-the-air updates for React Native apps
- Backward compatibility for older app versions

## DO NOT

- Design for desktop first and shrink to mobile (mobile-first approach)
- Ignore network conditions (design for 3G/slow networks)
- Overload with animations (drains battery)
- Use tiny text or small touch targets
- Forget about offline scenarios
- Neglect push notification permissions and privacy
- Build without considering iOS/Android guidelines
- Ship without load and stress testing

Build mobile apps that work as hard as the athletes using them, even with weak connections and in distracting environments.
