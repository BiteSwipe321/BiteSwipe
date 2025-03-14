import mongoose from 'mongoose';
import { UserModel } from '../models/user';
import { Restaurant } from '../models/restaurant';
import { Session } from '../models/session';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { MongoDocument } from '../models/appTypes';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Global configuration
const DATA_DIR = path.join(__dirname, '../../data');
const INITIAL_RESTAURANTS_FILE = 'initial-restaurants.json';
const INITIAL_USERS_FILE = 'initial-users.json';
const INITIAL_SESSIONS_FILE = 'initial-sessions.json';
const DB_URI = process.env.DB_URI ?? 'mongodb://localhost:27017/biteswipe';
console.log(`Database URI: ${DB_URI} [Source: ${process.env.DB_URI ? 'ENV' : 'DEFAULT'}]`);


function transformMongoId(doc: MongoDocument): MongoDocument {
    const transformed = { ...doc };
    
    // Handle all properties recursively
    for (const [key, value] of Object.entries(doc)) {
        if (value && typeof value === 'object') {
            if ('$oid' in value) {
                // Handle ObjectId
                transformed[key] = value.$oid;
            } else if ('$date' in value) {
                // Skip date fields - we'll handle them separately for sessions
                transformed[key] = value;
            } else if (Array.isArray(value)) {
                // Handle arrays recursively
                transformed[key] = value.map(item => 
                    typeof item === 'object' ? transformMongoId(item) : item
                );
            } else {
                // Handle nested objects recursively
                transformed[key] = transformMongoId(value);
            }
        }
    }
    
    return transformed;
}

function updateSessionDates(session: any): any {
    const now = new Date();
    
    // If we have existing dates, calculate the time delta
    let timeDelta = 20 * 60 * 1000; // Default 20 minutes
    let usedDefault = true;

    if (session.createdAt?.$date && session.expiresAt?.$date) {
        const originalCreated = new Date(session.createdAt.$date);
        const originalExpires = new Date(session.expiresAt.$date);
        timeDelta = originalExpires.getTime() - originalCreated.getTime();
        usedDefault = false;
    }
    
    // Set new dates
    const expires = new Date(now.getTime() + timeDelta);

    // Log timing details
    const minutes = Math.round(timeDelta / (60 * 1000));
    console.log(`Session timing: ${usedDefault ? '(using default) ' : ''}created at ${now.toISOString()}, expires in ${minutes} minutes`);
    
    return {
        ...session,
        createdAt: now,
        expiresAt: expires
    };
}

async function seedDatabase() {
    try {
        // Connect to MongoDB
        await mongoose.connect(DB_URI);
        console.log('[Mongoose] Connected to', DB_URI);

        // Clear existing data
        await UserModel.deleteMany({});
        await Restaurant.deleteMany({});
        await Session.deleteMany({});
        console.log('Cleared existing data');

        // Read and insert users
        const usersPath = path.join(__dirname, '..', 'data', INITIAL_USERS_FILE);
        const usersData = fs.readFileSync(usersPath, 'utf-8');
        const usersJson = JSON.parse(usersData);
        
        // Transform users data
        const users = Array.isArray(usersJson) 
            ? usersJson.map(transformMongoId)
            : [transformMongoId(usersJson)];

        // Insert users
        const insertedUsers = await UserModel.insertMany(users);
        console.log(`Successfully imported ${insertedUsers.length} users`);

        // Read and insert restaurants
        const jsonPath = path.join(__dirname, '..', 'data', INITIAL_RESTAURANTS_FILE);
        const jsonData = fs.readFileSync(jsonPath, 'utf-8');
        const restaurantsJson = JSON.parse(jsonData);
        
        // Transform and insert restaurants
        const transformedRestaurants = (Array.isArray(restaurantsJson) ? restaurantsJson : [restaurantsJson])
            .map(transformMongoId)
            .map((restaurant: MongoDocument) => ({
                ...(restaurant._id && { _id: restaurant._id }),
                name: (restaurant as unknown).name,
                address: (restaurant as unknown).location?.address ?? '',
                location: {
                    type: 'Point',
                    coordinates: [
                        (restaurant as unknown).location?.coordinates?.longitude ?? 0,
                        (restaurant as unknown).location?.coordinates?.latitude ?? 0
                    ]
                },
                phoneNumber: (restaurant as unknown).contact?.phone ?? '',
                website: (restaurant as unknown).contact?.website ?? '',
                primaryImage: (restaurant as unknown).images?.primary ?? '',
                galleryImages: (restaurant as unknown).images?.gallery ?? [],
                cuisine: (restaurant as unknown).cuisine ?? '',
                priceRange: (restaurant as unknown).priceRange ?? '',
                rating: (restaurant as unknown).rating ?? 0,
                openingHours: (restaurant as unknown).openingHours ?? '',
                googlePlaceId: (restaurant as unknown).sourceData?.googlePlaceId ?? ''
            }));

        const insertedRestaurants = await Restaurant.insertMany(transformedRestaurants);
        console.log(`Successfully imported ${insertedRestaurants.length} restaurants`);

        // Read and insert sessions
        const sessionsPath = path.join(__dirname, '..', 'data', INITIAL_SESSIONS_FILE);
        const sessionsData = fs.readFileSync(sessionsPath, 'utf-8');
        const sessionsJson = JSON.parse(sessionsData);
        
        // Transform sessions data
        const sessions = Array.isArray(sessionsJson) 
            ? sessionsJson.map(transformMongoId).map(updateSessionDates)
            : [updateSessionDates(transformMongoId(sessionsJson))];

        // Insert sessions
        const insertedSessions = await Session.insertMany(sessions);
        console.log(`Successfully imported ${insertedSessions.length} sessions`);

        console.log('Database seeding completed!');
    } catch (error) {
        console.error('Error seeding database:', error);
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            console.error('Could not find one of the data files. Make sure both files exist in the src/data directory:');
            console.error(`- ${INITIAL_USERS_FILE}`);
            console.error(`- ${INITIAL_RESTAURANTS_FILE}`);
            console.error(`- ${INITIAL_SESSIONS_FILE}`);
        } else {
            console.error('Full error:', error);
        }
    } finally {
        await mongoose.connection.close();
    }
}

// Run the seeding
seedDatabase();
