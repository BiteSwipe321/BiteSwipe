import { getMessaging } from '../config/firebase';
import { Types } from 'mongoose';
import { UserModel } from '../models/user';

export class NotificationService {
    async sendSessionInvite(sessionId: Types.ObjectId, invitedUserId: Types.ObjectId, inviterName: string) {
        try {
            // Get the user's FCM token from the database
            const user = await UserModel.findById(invitedUserId);
            if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
                console.error('User not found or no FCM tokens available');
                return;
            }

            // Send to all user's FCM tokens
            const responses = await Promise.all(user.fcmTokens.map(async (fcmToken) => {
                // Prepare the notification message
                const message = {
                    notification: {
                        title: 'New BiteSwipe Session Invite!',
                        body: `${inviterName} has invited you to join their food session`
                    },
                    data: {
                        sessionId: sessionId.toString(),
                        type: 'SESSION_INVITE'
                    },
                    token: fcmToken
                };

                return getMessaging().send(message);
            }));

            // Log all responses
            responses.forEach((response, index) => {
                console.log(`Successfully sent notification to token ${index + 1}:`, response);
            });

            return responses;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }

    async sendNotification(token: string, title: string, body: string) {
        try {
            const message = {
                notification: {
                    title,
                    body,
                },
                token
            };

            const response = await getMessaging().send(message);
            //console.log('Successfully sent notification:', response);
            return response;
        } catch (error) {
            console.error('Error sending notification:', error);
            throw error;
        }
    }
}
