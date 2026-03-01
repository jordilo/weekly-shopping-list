# Project Architecture

## Overview
This is a **Weekly Shopping List** progressive web application (PWA) built with **Next.js** and **TypeScript**. It uses a serverless architecture with **MongoDB (Mongoose)** for data storage and the **Web Push API** for real-time notifications.

## Tech Stack
- **Frontend**: React 19, Next.js 16 (App Router), Tailwind CSS 4.
- **Backend**: Next.js API Routes (Route Handlers).
- **Database**: MongoDB via Mongoose.
- **Offline Support**: Service Workers (PWA).
- **Notifications**: Web Push API (via `web-push` library).

## Project Structure
- `src/app/`: Next.js App Router pages and API routes.
- `src/components/`: Reusable UI components.
- `src/lib/`: Core logic, database connection, and data models.
- `public/`: Static assets and Service Worker (`sw.js`).
- `tests/`: End-to-end tests using Playwright.

## Key Services
### Database Connection (`src/lib/db.ts`)
The connection is cached globally to prevent exhaustion in serverless environments. It uses the `MONGODB_URI` environment variable.

### Push Notifications (`src/lib/push.ts`)
The application uses VAPID keys to authenticate with push services. Subscriptions are stored in the database and notifications are sent when new items are added.

### Data Synchronization
The application uses a hybrid approach:
1. **Client-side state**: Managed within React components.
2. **Persistence**: API calls update the MongoDB database.
3. **PWA**: Configured to work offline with local caching.
