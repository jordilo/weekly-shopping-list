# Database Schema

The application uses Mongoose to interact with MongoDB. All schemas are defined in `src/lib/models.ts`.

## Models

### User
Represents an authenticated user.
- `email`: String (Required, Unique)
- `name`: String
- `picture`: String
- `defaultListId`: ObjectId (Ref: `ShoppingList`)
- `createdAt`: Number (Timestamp)

### ShoppingList
Represents a group of shopping items.
- `name`: String (Required)
- `ownerId`: ObjectId (Ref: `User`, Required)
- `createdAt`: Number (Timestamp)

### ListMembership
Stores the relationship between users and shopping lists.
- `listId`: ObjectId (Ref: `ShoppingList`, Required)
- `userId`: ObjectId (Ref: `User`, Required)
- `role`: String (Enum: `owner`, `member`, Default: `member`)
- `joinedAt`: Number (Timestamp)

### Invitation
Tracks pending and processed list invitations.
- `listId`: ObjectId (Ref: `ShoppingList`, Required)
- `inviterUserId`: ObjectId (Ref: `User`, Required)
- `inviteeEmail`: String (Required)
- `status`: String (Enum: `pending`, `accepted`, `rejected`, Default: `pending`)
- `createdAt`: Number (Timestamp)

### Item
Represents a shopping list item, scoped to a list.
- `name`: String (Required)
- `completed`: Boolean (Default: `false`)
- `category`: String
- `quantity`: String (Default: `"1"`)
- `listId`: ObjectId (Ref: `ShoppingList`, Required)
- `createdAt`: Number (Timestamp)

### History
Learned categories for items, scoped by user.
- `name`: String (Required)
- `category`: String (Learned category)
- `userId`: ObjectId (Ref: `User`, Required)

### Meta
List-specific application configuration (e.g., `weekStartDate`).
- `key`: String (Required)
- `value`: Mixed (Required)
- `listId`: ObjectId (Ref: `ShoppingList`)

### Category
Defines the global sorting order and names of shopping categories.
- `name`: String (Required, Unique)
- `order`: Number (Default: `0`)

### PushSubscription
Stores browser push subscriptions for notifications.
- `endpoint`: String (Required, Unique)
- `keys`:
    - `p256dh`: String (Required)
    - `auth`: String (Required)
- `userId`: ObjectId (Ref: `User`, Required)
- `expirationTime`: Number
- `createdAt`: Number (Timestamp)
