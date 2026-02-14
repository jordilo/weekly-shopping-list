# Implementation Plan - Weekly Shopping List

## Goal Description
Create a "Week by Week" shopping list application for a couple. The app will allow users to add items, mark them as purchased, and organize lists by week. It will be built with React and Node.js (via Next.js) and optimized for Vercel deployment.

## User Review Required
> [!NOTE]
> For data persistence, I will start with **Local Storage** (client-side) for the MVP to keep it simple and immediately usable without setting up a database. If you require a backend database (like PostgreSQL or MongoDB), please let me know.

## Proposed Changes

### Tech Stack
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Deployment**: Vercel

### Components

#### [MODIFY] [`app/page.tsx`](file:///C:/Users/jlope/.gemini/antigravity/scratch/weekly-shopping-list/src/app/page.tsx)
- Main dashboard view.
- Displays the current week's shopping list.

#### [NEW] [`components/shopping-list.tsx`](file:///C:/Users/jlope/.gemini/antigravity/scratch/weekly-shopping-list/src/components/shopping-list.tsx)
- Renders the list of items.
- Checkbox to mark as bought.
- Delete button.

#### [NEW] [`components/add-item-form.tsx`](file:///C:/Users/jlope/.gemini/antigravity/scratch/weekly-shopping-list/src/components/add-item-form.tsx)
- Input field for item name.
- Optional category selection.

#### [MODIFY] [`lib/hooks/use-shopping-list.ts`](file:///d:/code/weekly-shopping-list/src/lib/hooks/use-shopping-list.ts)
- Custom hook to manage state and local storage persistence.
- **New**: Track `history` of all unique items added.
- **New**: Track `weekStartDate`.

#### [MODIFY] [`components/add-item-form.tsx`](file:///d:/code/weekly-shopping-list/src/components/add-item-form.tsx)
- **New**: Accept `suggestions` prop.
- **New**: Implement `<datalist>` for native autocomplete.

#### [MODIFY] [`app/page.tsx`](file:///d:/code/weekly-shopping-list/src/app/page.tsx)
- **New**: Display current week start date in header.

## Verification Plan
### Automated Tests
- Build verification: `npm run build`

### Manual Verification
- Open app in browser.
- Add an item "Milk".
- Refresh page (ensure "Milk" persists).
- Check "Milk" as bought (ensure UI updates).
- Delete "Milk".
- **New**: Type "M" in the input and verify "Milk" appears as a suggestion.
- **New**: Verify header shows "Week of [Date]". Click "New Week" and verify date updates.
