# Database Schema

The application uses Mongoose to interact with MongoDB. All schemas are defined in `src/lib/models.ts`.

## Models

### Item
Represents a shopping list item.
- `name`: String (Required)
- `completed`: Boolean (Default: `false`)
- `category`: String
- `createdAt`: Number (Timestamp, defaults to `Date.now()`)

### History
Stores learned categories for items to provide suggestions.
- `name`: String (Required, Unique)
- `category`: String

### Meta
Key-value store for application configuration (e.g., `weekStartDate`).
- `key`: String (Required, Unique)
- `value`: Mixed (Required)

### Category
Defines the sorting order and names of shopping categories.
- `name`: String (Required, Unique)
- `order`: Number (Default: `0`)

### PushSubscription
Stores browser push subscriptions for notifications.
- `endpoint`: String (Required, Unique)
- `keys`:
    - `p256dh`: String (Required)
    - `auth`: String (Required)
- `expirationTime`: Number
- `createdAt`: Number (Timestamp)
