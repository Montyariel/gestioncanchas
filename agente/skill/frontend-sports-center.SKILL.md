---
name: frontend-sports-center
description: Build stunning, high-performance web interfaces for sports center management. Focus on real-time booking dashboards, responsive layouts, data visualization for analytics, and seamless payment flows.
license: Complete terms in LICENSE.txt
---

This skill guides the development of premium frontend experiences for sports center management, ensuring a modern, fast, and intuitive interface for both staff and athletes.

## Frontend Requirements for Sports Centers

### Booking Dashboard
- **Real-Time Grid**: Visual representation of court availability.
- **Drag-and-Drop**: Easy rescheduling and booking management.
- **Filtering**: By court type (football/padel), surface, lighting, and time slots.
- **Dynamic Pricing Display**: Real-time price updates based on selections.

### User & Player Profiles
- **Activity History**: View past and upcoming matches.
- **Membership Status**: Visual indicators for loyalty tiers.
- **Team Management**: Interface for creating and joining teams.
- **Notification Settings**: Control over SMS/Email/Push alerts.

### Admin & Staff Interface
- **Revenue Analytics**: Charts and graphs for financial health.
- **Occupancy Heatmaps**: Identify peak hours and underused slots.
- **Court Management**: Quick toggle for maintenance status.
- **User Search & CRM**: Fast access to player data and history.

## Architecture & Tech Stack

### Recommended Stack
- **Framework**: React.js or Next.js (for SEO and performance).
- **Styling**: Tailwind CSS (for rapid, consistent design).
- **State Management**: Zustand or Redux Toolkit.
- **Data Fetching**: TanStack Query (React Query) for caching and sync.
- **Animations**: Framer Motion (for premium micro-interactions).

### Key Principles
- **Component-Driven Development**: Build a reusable library of UI components.
- **Responsive Design**: Mobile-first approach (essential for players on the go).
- **Accessibility**: WCAG 2.1 compliance for inclusive usage.
- **Performance**: Optimized bundle sizes and fast First Contentful Paint.

## Design System & Aesthetics

### Visual Identity
- **Modern & Dynamic**: Use vibrant colors (sports-themed) with sleek dark modes.
- **Glassmorphism**: Subtle transparency for a modern, premium feel.
- **Typography**: Clean, bold fonts (e.g., Inter, Montserrat, Roboto).
- **Iconography**: Custom sports-related icons for quick recognition.

### UI Components
- **Court Status Cards**: Clear color coding (Green: Available, Red: Occupied, Grey: Maintenance).
- **Interactive Timelines**: For viewing daily court schedules.
- **Payment Modals**: Secure, clear, and fast checkout flows.
- **Success Celebrations**: Micro-animations when a booking is confirmed.

## Implementation Workflow

1. **Setup Foundation**: Configure Tailwind, theme colors, and base components.
2. **Build Layouts**: Create the main dashboard, booking flow, and profile pages.
3. **Integrate Real-Time Data**: Connect to backend via WebSockets or polling for live updates.
4. **Optimize Performance**: Implement code splitting, image optimization, and caching.
5. **Add Polish**: Implement transitions, hover effects, and micro-animations.

## DO NOT

- Use generic browser defaults (buttons, inputs, scrolls).
- Overload pages with data (use progressive disclosure).
- Ignore mobile usability (players book from the field).
- Sacrifice speed for heavy animations.
- Forget error states and loading skeletons.

Build interfaces that feel as fast and dynamic as a match on the field.
