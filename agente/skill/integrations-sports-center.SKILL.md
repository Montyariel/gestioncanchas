---
name: integrations-sports-center
description: Integrate third-party services for sports center apps. Connect payment gateways, SMS/email notifications, calendar systems, analytics platforms, and CRM tools. Manage APIs, webhooks, authentication, and error handling.
license: Complete terms in LICENSE.txt
---

This skill guides integration of external services essential for a complete sports center management platform.

## Critical Integrations for Sports Centers

### Payment & Billing Integrations
- **Stripe, PayPal, Square**: Card payments, ACH transfers
- **Local Payment Gateways**: Country-specific alternatives
- **Subscription Management**: Recurring billing, invoice generation
- **Tax Calculation**: Regional tax compliance
- **Refund Management**: Automated and manual refund processing

### Communication Services
- **SMS Notifications**: Booking reminders, confirmations (Twilio, AWS SNS)
- **Email Notifications**: Newsletters, receipts, team invitations (SendGrid, Mailgun)
- **Push Notifications**: Mobile app alerts (Firebase Cloud Messaging, OneSignal)
- **In-App Messaging**: Real-time chat/notifications (Socket.io, Pusher)

### Calendar & Scheduling
- **Google Calendar Integration**: Sync bookings to user calendars
- **Outlook/Office 365**: Calendar integration for team events
- **iCal**: Standard calendar format export
- **Timezone Management**: Handle multiple time zones correctly

### Maps & Location Services
- **Google Maps API**: Display court locations, directions
- **Apple Maps**: iOS-specific map functionality
- **Geolocation Services**: Location-based court suggestions

### Analytics & Insights
- **Google Analytics**: User behavior tracking
- **Mixpanel/Amplitude**: Event tracking and funnels
- **Tableau/Power BI**: Business intelligence dashboards
- **Custom Analytics**: Custom metrics for sports business

### CRM & Customer Support
- **Intercom/Zendesk**: Customer support tickets
- **HubSpot CRM**: Customer relationship management
- **Slack Integration**: Internal notifications and alerts
- **Helpdesk**: Support ticketing system

### Document & Invoice Management
- **PDF Generation**: Receipt and invoice creation
- **E-signature**: Contract signing (DocuSign, SignEasy)
- **Storage Services**: Document archival (AWS S3, Google Cloud Storage)

## Integration Architecture

### API Design Patterns
- **Webhooks**: Handle events from external services (payment confirmed, booking reminder sent)
- **Polling**: Periodically fetch updates from external APIs
- **Event Streaming**: Real-time data syncing with event buses
- **REST/GraphQL**: Standard API communication

### Authentication Methods
- **API Keys**: For server-to-server communication
- **OAuth2**: For user-delegated access (Google Calendar, Outlook)
- **Webhooks Signing**: Verify webhook authenticity with HMAC signatures
- **Credentials Management**: Secure storage of API keys (environment variables, vaults)

### Error Handling & Retry Logic
- **Exponential Backoff**: Retry failed requests with increasing delays
- **Circuit Breaker Pattern**: Stop attempting if service is down
- **Fallback Mechanisms**: Graceful degradation if third-party fails
- **Logging & Monitoring**: Track integration failures and performance
- **Alert System**: Notify admins of critical integration failures

### Rate Limiting & Quotas
- **Respect Third-Party Limits**: Handle rate limit headers
- **Queue System**: Use message queues for bulk operations
- **Caching**: Cache external data to reduce API calls
- **Batch Requests**: Combine multiple requests when possible

## Payment Integration Deep Dive

### Implementation Steps
1. **Choose Provider**: Stripe recommended for flexibility, Wix/Shopify for simplicity
2. **PCI Compliance**: Use tokenization to never handle raw card data
3. **Payment Flow**:
   - User provides payment details
   - Create payment token via provider
   - Send token to your backend
   - Process payment server-side
   - Receive confirmation webhook
   - Update booking status
   - Notify user

### Webhook Handling for Payments
```javascript
// Example: Stripe webhook handler
POST /webhooks/stripe
- payment_intent.succeeded → Mark booking as paid
- payment_intent.payment_failed → Mark booking as unpaid, send retry
- charge.refunded → Process refund, update booking status
- customer.subscription.updated → Update membership tier
```

### Refund Strategy
- Automated refunds (full refund if cancelled >24h before)
- Partial refunds for no-shows (50% retention)
- Manual refunds for disputes
- Clear refund policy in terms

### Multi-Currency & Localization
- Accept payments in local currency
- Convert and display prices correctly
- Handle tax/VAT by location
- Compliance with local payment regulations

## SMS & Email Notifications

### Notification Types
- **Booking Confirmations**: Immediate after booking
- **Reminders**: 24h and 15 min before booking
- **Cancellations**: When user or system cancels booking
- **Payment Reminders**: If payment fails
- **Team Invitations**: New group booking notifications
- **Promotions**: Special offers and discounts
- **System Alerts**: Maintenance notices, policy changes

### Notification Preferences
- Allow users to opt-in/opt-out per channel
- Respect quiet hours (no SMS between 9pm-8am)
- User-controlled frequency (no notification spam)
- Clear unsubscribe mechanisms

### SMS Best Practices
- Keep messages under 160 characters (avoid split SMSes)
- Use dynamic content (player name, court name)
- Include actionable links (confirm, cancel, view)
- International phone number formatting

### Email Best Practices
- Responsive HTML templates
- Clear subject lines and preview text
- Strong CTA buttons
- Unsubscribe link in footer
- Plain text fallback
- Authentication (SPF, DKIM, DMARC)

## Calendar Integration

### Google Calendar Sync
```javascript
// OAuth2 flow
1. Get user's Google Calendar authorization
2. Create calendar event after booking
3. Update event if booking changes
4. Delete event if booking cancelled
5. Request scopes: calendar.events
```

### iCal Export
- Generate .ics file for booking
- Include court info, time, participant list
- Support recurring bookings
- Make calendar downloadable

### Timezone Handling
- Store all times in UTC
- Convert to user's local timezone for display
- Handle DST transitions
- Support different timezone per booking

## Map & Location Services

### Google Maps Integration
- **Display Courts**: Show all facilities on map
- **Directions**: Get route from user location to court
- **Place Search**: Help users find nearby courts
- **Street View**: Preview facility exterior

### Geolocation Features
- **User Location Detection**: Permission-based location tracking
- **Nearest Courts**: Find courts within radius
- **Distance Display**: Show distance to each court
- **Geo-fencing**: Trigger check-in when arriving

## Analytics & Tracking

### Key Events to Track
- User registration
- Booking creation and completion
- Payment transactions
- Cancellations and no-shows
- Team creation
- Feature usage
- Session duration
- Page views

### Custom Metrics for Sports
- Average occupancy rate
- Peak booking times
- Most popular courts
- Revenue per court
- Player retention rate
- Team growth
- Seasonal trends

### Dashboards & Reports
- Real-time occupancy
- Daily/weekly/monthly revenue
- User acquisition and retention
- Popular time slots
- Cancellation rate
- Payment success rate

## Integration Testing & Monitoring

### Testing Strategy
- **Unit Tests**: Individual integration components
- **Integration Tests**: End-to-end payment flows
- **Webhook Testing**: Use services like RequestBin to debug
- **Sandbox/Staging**: Test in provider's sandbox before production

### Monitoring & Alerting
- Monitor API response times
- Track webhook failures
- Alert on payment processing errors
- Monitor quota usage
- Set up dead letter queues for failed messages

### Fallback & Redundancy
- Multiple payment gateway support (Stripe + PayPal)
- SMS fallback to email notifications
- Alternative calendar sync methods
- Graceful degradation if service down

## Security Considerations

- **Secrets Management**: Use environment variables or secret vaults (AWS Secrets Manager)
- **Webhook Verification**: Always verify webhook signatures
- **Rate Limiting**: Protect against abuse
- **API Key Rotation**: Regular key updates
- **PCI Compliance**: Never store raw card data
- **Data Encryption**: Encrypt sensitive data in transit and at rest
- **Access Control**: Limit API access to necessary scopes

## Cost Optimization

- **API Usage**: Monitor and optimize API calls
- **Pricing Tiers**: Choose right tier for expected volume
- **Bulk Operations**: Combine requests when possible
- **Caching**: Reduce redundant API calls
- **Monitoring**: Track spending and adjust as needed

## Example Integration: Complete Booking Flow
