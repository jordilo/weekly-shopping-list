# AGENTS.md

## Project Overview
**Weekly Shopping List** is a Progressive Web Application (PWA) designed to help users manage their grocery lists efficiently. It supports offline usage and real-time push notifications.

### Core Technologies
- **Frontend**: Next.js (App Router), React 19, Tailwind CSS 4.
- **Database**: MongoDB with Mongoose.
- **Real-time**: Web Push API for notifications.
- **Testing**: Playwright for E2E testing.

## Repository Structure
AI Agents should be aware of the following directory layout:

```
.
├── .github/          # GitHub Actions and AI context instructions
│   ├── copilot_instructions.md  # Core rules for AI agents
│   └── workflows/    # CI/CD pipelines
├── public/           # Static assets and Service Worker
│   ├── icons/        # PWA manifest icons
│   └── sw.js         # Service Worker for offline support
├── src/              # Application source code
│   ├── app/          # Next.js App Router (pages and API routes)
│   ├── components/   # React components and UI elements
│   └── lib/          # Utilities, DB models, and shared logic
│       ├── models.ts # Mongoose schemas
│       ├── db.ts     # MongoDB connection management
│       └── push.ts   # Web Push configuration
├── tests/            # Playwright end-to-end tests
├── AGENTS.md         # AI Agent guidelines (this file)
├── ARCHITECTURE.md   # High-level architecture overview
└── SCHEMA.md         # Detailed database schema reference
```

## Setup & Development
The following commands are available for environment setup and validation:

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run end-to-end tests
npm run test

# Run linting checks
npm run lint
```

## Agent Guidelines

### 1. Database Operations
- **Connection**: Always call `await dbConnect()` from `@/lib/db` before performing any database operations in API routes.
- **Models**: Use the Mongoose models defined in `@/lib/models`.
- **Formatting**: API routes should transform `_id` to `id` (as a string) when returning data to the frontend for consistency.

### 2. UI and Styling
- **Tailwind**: Follow the existing Tailwind CSS 4 patterns. Avoid ad-hoc styles; use the configuration-driven approach.
- **Icons**: Use `lucide-react` for iconography.
- **Mobility**: Prioritize responsive, touch-friendly designs as this is primarily a mobile PWA.

### 3. Progressive Web App (PWA)
- When modifying the Service Worker (`public/sw.js`), ensure that it remains compatible with the offline-first strategy.
- Updates to `manifest.json` should be reflected in the PWA configuration.

### 4. Push Notifications
- Notification logic is centralized in `@/lib/push`.
- Use the `WebPushSubscription` model in `src/lib/models.ts` to manage subscribers.

### 5. Documentation First
- Refer to `ARCHITECTURE.md` for the system design.
- Refer to `SCHEMA.md` for data structures.
- Keep these files updated when making fundamental changes to the stack or schema.
