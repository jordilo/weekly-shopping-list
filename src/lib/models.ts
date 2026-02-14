import mongoose, { Schema, model, models } from 'mongoose';

// --- Item Model ---
const ItemSchema = new Schema({
    name: { type: String, required: true },
    completed: { type: Boolean, default: false },
    category: String,
    createdAt: { type: Number, default: () => Date.now() },
});

// Use 'models' to prevent recompilation error in Next.js hot reloading
export const Item = models.Item || model('Item', ItemSchema);

// --- History Model ---
const HistorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    category: { type: String }, // Learned category
});

export const History = models.History || model('History', HistorySchema);

// --- Meta Model ---
// Used for key-value storage like 'weekStartDate'
const MetaSchema = new Schema({
    key: { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
});

export const Meta = models.Meta || model('Meta', MetaSchema);

// --- Category Model ---
const CategorySchema = new Schema({
    name: { type: String, required: true, unique: true },
    order: { type: Number, default: 0 },
});

export const Category = models.Category || model('Category', CategorySchema);
