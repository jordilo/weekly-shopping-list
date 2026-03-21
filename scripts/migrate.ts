/**
 * Migration script: Assigns all existing data to the initial user.
 *
 * Usage:
 *   npx tsx scripts/migrate.ts
 *
 * This script:
 * 1. Creates or finds the initial user by email
 * 2. Creates a default shopping list
 * 3. Assigns all existing items to that list
 * 4. Assigns all existing history records to the user
 * 5. Sets the user's default list
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const INITIAL_USER_EMAIL = 'jordi8284@gmail.com';
const INITIAL_USER_NAME = 'Jordi';

const MONGODB_URI = process.env.PROD_MONGODB_URI_MONGODB_URI || process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('No MONGODB_URI found in .env.local');
    process.exit(1);
}

async function migrate() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected.');

    const db = mongoose.connection.db;
    if (!db) {
        console.error('Database connection not established');
        process.exit(1);
    }

    // 1. Create or find the user
    const usersCol = db.collection('users');
    let user = await usersCol.findOne({ email: INITIAL_USER_EMAIL });

    if (!user) {
        console.log(`Creating user: ${INITIAL_USER_EMAIL}`);
        const result = await usersCol.insertOne({
            email: INITIAL_USER_EMAIL,
            name: INITIAL_USER_NAME,
            picture: '',
            createdAt: Date.now(),
        });
        user = await usersCol.findOne({ _id: result.insertedId });
    } else {
        console.log(`User already exists: ${user.email}`);
    }

    if (!user) {
        console.error('Failed to create user');
        process.exit(1);
    }

    const userId = user._id;

    // 2. Create default shopping list
    const shoppingListsCol = db.collection('shoppinglists');
    let defaultList = await shoppingListsCol.findOne({ ownerId: userId });

    if (!defaultList) {
        console.log('Creating default shopping list...');
        const result = await shoppingListsCol.insertOne({
            name: 'Weekly Shopping',
            ownerId: userId,
            createdAt: Date.now(),
        });
        defaultList = await shoppingListsCol.findOne({ _id: result.insertedId });
    } else {
        console.log(`Default list already exists: ${defaultList.name}`);
    }

    if (!defaultList) {
        console.error('Failed to create shopping list');
        process.exit(1);
    }

    const listId = defaultList._id;

    // 3. Create ListMembership for owner
    const membershipsCol = db.collection('listmemberships');
    const existingMembership = await membershipsCol.findOne({ listId, userId });
    if (!existingMembership) {
        console.log('Creating owner membership...');
        await membershipsCol.insertOne({
            listId,
            userId,
            role: 'owner',
            joinedAt: Date.now(),
        });
    }

    // 4. Assign all items to the list
    const itemsCol = db.collection('items');
    const itemsResult = await itemsCol.updateMany(
        { listId: { $exists: false } },
        { $set: { listId } }
    );
    console.log(`Updated ${itemsResult.modifiedCount} items with listId`);

    // Also handle items that exist but have null listId
    const itemsResult2 = await itemsCol.updateMany(
        { listId: null },
        { $set: { listId } }
    );
    console.log(`Updated ${itemsResult2.modifiedCount} items with null listId`);

    // 5. Assign all history records to the user
    const historiesCol = db.collection('histories');
    const historyResult = await historiesCol.updateMany(
        { userId: { $exists: false } },
        { $set: { userId } }
    );
    console.log(`Updated ${historyResult.modifiedCount} history records with userId`);

    const historyResult2 = await historiesCol.updateMany(
        { userId: null },
        { $set: { userId } }
    );
    console.log(`Updated ${historyResult2.modifiedCount} history records with null userId`);

    // 6. Update meta records to be list-scoped
    const metaCol = db.collection('metas');
    const metaResult = await metaCol.updateMany(
        { listId: { $exists: false } },
        { $set: { listId } }
    );
    console.log(`Updated ${metaResult.modifiedCount} meta records with listId`);

    // 7. Update push subscriptions with userId
    const pushCol = db.collection('pushsubscriptions');
    const pushResult = await pushCol.updateMany(
        { userId: { $exists: false } },
        { $set: { userId } }
    );
    console.log(`Updated ${pushResult.modifiedCount} push subscriptions with userId`);

    // 8. Set user's default list
    await usersCol.updateOne(
        { _id: userId },
        { $set: { defaultListId: listId } }
    );
    console.log('Set default list for user');

    console.log('\nMigration complete!');
    console.log(`User: ${INITIAL_USER_EMAIL} (${userId})`);
    console.log(`Default List: ${defaultList.name} (${listId})`);

    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
