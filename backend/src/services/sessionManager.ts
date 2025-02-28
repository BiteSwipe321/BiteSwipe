import { Session } from '../models/session';
import mongoose, { ObjectId } from 'mongoose';
import { Types } from 'mongoose';
import { UserModel } from '../models/user';
import { RestaurantService } from './RestaurantService';

export class SessionManager {

    private restaurantService: RestaurantService;

    constructor() {
        this.restaurantService = new RestaurantService();
    }
    
    async createSession(creatorId: Types.ObjectId, settings: any) {
        try {
            // Check if user exists
            const user = await UserModel.findById(creatorId);
            if (!user) {
                const error = new Error() as Error & { code: string };
                error.code = 'USER_NOT_FOUND';
                throw error;
            }

            const restaurants = await this.restaurantService.addRestaurants(settings.location,'');
        
            const session = new Session({
                creator: creatorId,
                settings: settings,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() +  20 * 60 * 1000), // we can make it dynamic later 
                participants: [{
                    userId: creatorId
                }],
                restaurants: restaurants.map(r => ({
                    restaurantId: r._id,
                    score: 0,
                    totalVotes: 0,
                    positiveVotes: 0
                }))
            });

            return await session.save();
        } catch (error) {
            console.error('Session creation error:', error);
            throw error;
        }
    }

    async inviteParticipant(sessionId: Types.ObjectId, userId: Types.ObjectId) {
        const session = await Session.findById(sessionId);
        if (!session || session.status.valueOf() === 'COMPLETED') {
            throw new Error('Session not found or already completed');
        }

        if(session.participants.length === 0) {
            session.participants.push({
                userId: userId,
                preferences: []
            });
        } else {
            const existingParticipant = session.participants.find(p => p.userId.equals(userId));
            if (!existingParticipant) {
                session.participants.push({
                    userId: userId,
                    preferences: []
                });
            }
        }

        return await session.save();
    }

    async getUserSessions(userId: Types.ObjectId) {
        try {
            const sessions = await Session.find({ 
                creator: userId,
                status: { $ne: 'COMPLETED' } // Only return active sessions
            }).sort({ createdAt: -1 }); // Most recent first
            
            return sessions;
        } catch (error) {
            console.error('Error fetching user sessions:', error);
            throw error;
        }
    }
}