# Weekly Shopping List - AI Instructions

This document provides context and guidelines for AI assistants working on this codebase.

## Project Overview

**Weekly Shopping List** is a Progressive Web App (PWA) built with **Next.js (App Router)**. It allows users to manage a shared shopping list in real-time.

### Key Tech Stack
- **Frontend**: React 19, Tailwind CSS, Lucide React.
- **Backend**: Next.js Route Handlers (API).
- **Database**: MongoDB (via Mongoose).
- **Notifications**: Web Push API (VAPID).
- **Testing**: Playwright (E2E tests).

### Architecture Patterns
- **API First**: Data is managed through `/api/...` routes.
- **Lazy Initialization**: Critical services like `web-push` are initialized lazily to prevent build-time failures.
- **Responsive Design**: Mobile-first approach using Tailwind CSS.

---

## Implementation Guidelines

### 1. Code Quality & Standards
- **ESLint**: Always respect the rules defined in `eslint.config.mjs`. Use `npm run lint` to verify.
- **Prettier**: Follow standard Prettier formatting. If no `.prettierrc` is present, use default settings (2-space indentation, semicolons, single quotes if possible).
- **TypeScript**: Use strict types. Avoid `any`. Prefer interfaces for models and props.

### 2. Testing Requirements
Every new feature or significant logic change **must** include tests in the `tests/` directory:
- **Happy Path**: At least one test demonstrating the feature working as intended.
- **Error Handling**: At least one test demonstrating how the system handles invalid input or server errors.
- **Playwright**: Use Playwright for E2E tests, ensuring the UI reflects the expected state.
- **Accessibility first** All the test should be based on accessibility selectors and try to avoid using css selectors, xpath or any other method that is not based on accessibility.
- **Test data**: All the test except vrt-spect.ts file should act as e2e, this means that all the test data should be created in the test and deleted after the test using connection with backend and database.

### 3. Style Guidelines (Premium & Modern)
We follow a **"Hero UI" (formerly NextUI)** aesthetic:
- **Aesthetics**: Use vibrant color palettes, smooth gradients, and glassmorphism where appropriate.
- **Dark Mode**: Support both light and dark modes (check `globals.css` and Tailwind `dark:` prefix).
- **Micro-animations**: Use Tailwind's `animate-...` classes for smooth transitions.
- **Premium Components**: Avoid basic HTML elements; wrap them in styled Tailwind components.
- **Typography**: Utilize the `Geist` font family as configured in `layout.tsx`.

### 4. Database & Models
- Models are located in `src/lib/models.ts`.
- Always call `dbConnect()` from `@/lib/db` at the start of any API route handler.

### 5. Push Notifications
- Use the utility in `src/lib/push.ts` for any push notification logic.
- Ensure `configureWebPush()` is called before sending notifications.

---

## Workflow Reminders
- When adding a new API route, ensure it's structured as `src/app/api/.../route.ts`.
- When adding a new component, put it in `src/components/` and use `"use client"` if it uses React hooks.
- **NEVER** leave sensitive keys in the code; use `.env.local` and provide examples in `.env.example`.
