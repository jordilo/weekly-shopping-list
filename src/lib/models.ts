import { Schema, model, models } from 'mongoose';

// --- User Model ---
const UserSchema = new Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String },
    picture: { type: String },
    language: { type: String, enum: ['en', 'es', 'ca'], default: 'en' },
    defaultListId: { type: Schema.Types.ObjectId, ref: 'ShoppingList' },
    createdAt: { type: Number, default: () => Date.now() },
});

export const User = models.User || model('User', UserSchema);

// --- ShoppingList Model ---
const ShoppingListSchema = new Schema({
    name: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Number, default: () => Date.now() },
});

export const ShoppingList = models.ShoppingList || model('ShoppingList', ShoppingListSchema);

// --- ListMembership Model ---
const ListMembershipSchema = new Schema({
    listId: { type: Schema.Types.ObjectId, ref: 'ShoppingList', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: ['owner', 'member'], default: 'member' },
    joinedAt: { type: Number, default: () => Date.now() },
});

ListMembershipSchema.index({ listId: 1, userId: 1 }, { unique: true });

export const ListMembership = models.ListMembership || model('ListMembership', ListMembershipSchema);

// --- Invitation Model ---
const InvitationSchema = new Schema({
    listId: { type: Schema.Types.ObjectId, ref: 'ShoppingList', required: true },
    inviterUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    inviteeEmail: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Number, default: () => Date.now() },
});

InvitationSchema.index({ listId: 1, inviteeEmail: 1, status: 1 });

export const Invitation = models.Invitation || model('Invitation', InvitationSchema);

// --- Item Model ---
const ItemSchema = new Schema({
    name: { type: String, required: true },
    completed: { type: Boolean, default: false },
    category: String,
    quantity: { type: String, default: '1' },
    listId: { type: Schema.Types.ObjectId, ref: 'ShoppingList', required: true },
    createdAt: { type: Number, default: () => Date.now() },
});

// Use 'models' to prevent recompilation error in Next.js hot reloading
export const Item = models.Item || model('Item', ItemSchema);

// --- History Model ---
const HistorySchema = new Schema({
    name: { type: String, required: true },
    category: { type: String }, // Learned category
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

HistorySchema.index({ userId: 1, name: 1 }, { unique: true });

export const History = models.History || model('History', HistorySchema);

// --- Meta Model ---
// Used for key-value storage like 'weekStartDate', scoped to a list
const MetaSchema = new Schema({
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    listId: { type: Schema.Types.ObjectId, ref: 'ShoppingList' },
});

MetaSchema.index({ key: 1, listId: 1 }, { unique: true });

export const Meta = models.Meta || model('Meta', MetaSchema);

// --- Category Model ---
const CategorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    order: { type: Number, default: 0 },
});

export const Category = models.Category || model('Category', CategorySchema);

// --- PushSubscription Model ---
const PushSubscriptionSchema = new Schema({
    endpoint: { type: String, required: true, unique: true },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true }
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    expirationTime: { type: Number },
    createdAt: { type: Number, default: () => Date.now() }
});

export const PushSubscription = models.PushSubscription || model('PushSubscription', PushSubscriptionSchema);
