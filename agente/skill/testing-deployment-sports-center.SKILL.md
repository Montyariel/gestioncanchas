---
name: testing-deployment-sports-center
description: Ensure quality and reliable deployment of sports center apps through comprehensive testing strategies, QA processes, and CI/CD pipelines. Cover unit, integration, end-to-end testing, performance optimization, and production deployment.
license: Complete terms in LICENSE.txt
---

This skill guides quality assurance, testing, and deployment of production-ready sports center management applications.

## Testing Strategy Overview

Testing pyramid for sports centers:
- **70% Unit Tests**: Individual functions and components
- **20% Integration Tests**: API endpoints, database operations, third-party integrations
- **10% End-to-End Tests**: Complete user workflows (booking → payment → confirmation)

## Unit Testing

### Frontend Component Testing

Tools: Jest, React Testing Library, Vue Test Utils

Example: Booking form validation test
- Shows error for past dates
- Submits booking with valid data

### Backend Logic Testing

Tools: Jest, Mocha, Pytest, RSpec

Test critical business logic:
- Booking conflict detection
- Dynamic pricing calculation
- Refund policy application
- Membership tier validation
- Court availability calculation

## Integration Testing

### API Endpoint Testing

Tools: Supertest, Postman, REST Client

Test complete request/response cycles:
- Request validation
- Database operations
- Response formatting
- Error handling
- Status codes

### Third-Party Integration Testing

Mock external services (Stripe, etc.)

## End-to-End Testing

Tools: Cypress, Selenium, Playwright

Test complete user flows:
- User books court
- User pays
- User receives confirmation
- Booking appears in calendar

## Performance Testing

### Load Testing

Tools: Apache JMeter, Locust, k6

Test system under load with:
- Ramp up phase (increase users gradually)
- Peak load phase
- Ramp down phase

### Critical Performance Thresholds
- Availability Query: < 1 second (user-facing)
- Booking Creation: < 3 seconds (user-facing)
- Payment Processing: < 5 seconds (user-facing)
- Webhook Processing: < 10 seconds (background)
- Report Generation: < 30 seconds (background)

### Browser Performance
- First Contentful Paint: < 1.5 seconds
- Largest Contentful Paint: < 2.5 seconds
- Time to Interactive: < 3.5 seconds
- Cumulative Layout Shift: < 0.1

Test with Lighthouse, WebPageTest

## Security Testing

### OWASP Top 10 Coverage
- SQL Injection prevention
- XSS prevention
- CSRF token validation
- Authentication security
- Sensitive data encryption
- Access control testing
- Vulnerable dependencies scanning

### Penetration Testing
- Hire security professionals annually
- Bug bounty program for continuous testing
- Regular vulnerability scanning (SAST, DAST)
- Dependency scanning for known vulnerabilities

## Mobile App Testing

### Device Testing
- Multiple device sizes and OS versions
- Emulators: iOS Simulator, Android Emulator
- Real devices: iPhone SE/12/14, Samsung Galaxy S20/S22
- Network conditions: WiFi, 4G, 3G, offline

### App-Specific Tests
- Offline functionality
- App store guidelines compliance
- Battery and memory usage
- Network state changes
- Push notification handling
- Deep link navigation

## QA Process & Checklists

### Pre-Release Checklist
- All unit tests passing (>80% coverage)
- All integration tests passing
- E2E critical flows tested
- Performance benchmarks met
- Security scan completed
- Accessibility audit passed (WCAG AA)
- Cross-browser/device tested
- Documentation updated
- Release notes prepared
- Rollback plan documented

### QA Test Plans by Feature

Booking Feature:
- Create new booking
- Edit booking
- Cancel booking with various policies
- Recurring bookings
- Conflict detection
- Price calculation

Payment Feature:
- Successful payment
- Failed payment
- Refund processing
- Partial refunds
- Tax calculation
- Multiple currencies

User Management:
- Registration
- Login/logout
- Password reset
- Profile editing
- Membership changes
- Permission validation

## Continuous Integration/Deployment (CI/CD)

### Pipeline Stages

Code Commit
  ↓
Automated Tests (5-10 min)
  - Lint & format check
  - Unit tests
  - Security scan
  ↓
Build (2-5 min)
  - Compile/bundle
  - Create artifacts
  ↓
Integration Tests (10-15 min)
  - API tests
  - Database tests
  - Third-party integrations
  ↓
Staging Deployment (5 min)
  - Deploy to staging
  - Smoke tests
  ↓
E2E Tests on Staging (10-15 min)
  - Complete user flows
  - Performance tests
  ↓
Manual QA Review (Optional)
  - Exploratory testing
  - Product review
  ↓
Production Deployment (Canary)
  - Deploy to 10% of users
  - Monitor metrics
  - Gradually increase to 100%

### Tools
- Version Control: GitHub, GitLab
- CI Server: GitHub Actions, GitLab CI, Jenkins
- Artifact Registry: Docker Hub, AWS ECR, GitHub Packages
- Deployment: Kubernetes, AWS ECS, Heroku
- Monitoring: DataDog, New Relic, Prometheus

### Monitoring & Alerts Post-Deployment

Track metrics:
- Error rate (< 0.1%)
- API response time (p95 < 500ms)
- Payment success rate (> 99%)
- User session errors
- Database performance
- Cache hit rates

Alert thresholds:
- Error rate spike > 0.5%
- Response time p95 > 1s
- Payment failures > 1%
- Database queries > 5s
- Memory usage > 80%

## Rollback Plan

- Quick Rollback: Can revert to previous version in < 5 minutes
- Data Consistency: Ensure database schema changes are compatible
- User Communication: Notify users if rollback occurs
- Post-Incident: Root cause analysis and prevention measures

## DO NOT

- Deploy without automated testing
- Skip security testing
- Release without performance testing
- Ignore error monitoring in production
- Neglect accessibility testing
- Skip mobile device testing
- Forget to test third-party integrations
- Deploy without a rollback plan
- Ignore test coverage metrics

Build testing processes that catch bugs before users do, ensuring sports centers can rely on your app.
