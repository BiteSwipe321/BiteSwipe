import { Model, Types } from 'mongoose';
import { UserModel } from '../models/user';

interface User {
  email: string;
  displayName: string;
  sessionHistory: any[];
  restaurantInteractions: any[];
}

export class UserService {
  private userModel: Model<User>;

  constructor(userModel: Model<User> = UserModel) {
    this.userModel = userModel;
  }

  async createUser(email: string, displayName: string): Promise<User> {
    if (!email || !displayName) {
      throw new Error('Email and displayName are required');
    }

    const existingUser = await this.getUserByEmail(email);

    if (existingUser) {
      throw new Error('User already exists');
    }

    try {
      const user = await this.userModel.create({
        email,
        displayName,
        sessionHistory: [],
        restaurantInteractions: []
      });

      console.log('User created successfully:', user);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw new Error('Failed to create user');
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    try {
      return await this.userModel.findById(userId).lean();
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw new Error('Failed to fetch user by ID');
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw new Error('Email is required');
    }

    try {
      return await this.userModel.findOne({ email }).lean();
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw new Error('Failed to fetch user by email');
    }
  }

  async updateFCMToken(userId: string, fcmToken: string): Promise<User | null> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID format');
    }

    if (!fcmToken) {
      throw new Error('FCM token is required');
    }

    try {
      const updatedUser = await this.userModel.findByIdAndUpdate(
        userId,
        { fcmToken },
        { new: true }
      ).lean();

      if (!updatedUser) {
        throw new Error('User not found');
      }

      return updatedUser;
    } catch (error) {
      console.error('Error updating FCM token:', error);
      throw new Error('Failed to update FCM token');
    }
  }
}