import mongoose from 'mongoose';
import { UserService } from '../../services/userService';
import {mockUserModel} from '../setup';

// This file tests the actual UserService implementation with mocked dependencies
// The UserModel is mocked in setup.ts
jest.unmock('../../services/userService');

// Create a function to mock the lean() method that all query methods should return
const createMockWithLean = (returnValue: any) => ({
  lean: jest.fn().mockResolvedValue(returnValue)
});

describe('UserService - Mocked Tests', () => {
  let userService: UserService;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockUserModel.findOne.mockReset();
    mockUserModel.create.mockReset();
    mockUserModel.findById.mockReset();
    mockUserModel.findByIdAndUpdate.mockReset();
    
    // Mock console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Create a new instance of UserService with our mock model for each test
    userService = new UserService(mockUserModel as any);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });



  describe('createUser', () => {
    test('should successfully create a new user', async () => {
      // Input: Valid email and displayName
      // Expected behavior: User is created after checking no existing user
      // Expected output: Newly created user object
      
      // Test data
      const email = 'test@example.com';
      const displayName = 'Test User';
      
      // Mock user returned from create
      const mockUser = {
        _id: 'new-user-id',
        email,
        displayName,
        sessionHistory: [],
        restaurantInteractions: []
      };
      
      // Mock getUserByEmail to return null (no existing user)
      mockUserModel.findOne.mockReturnValueOnce(createMockWithLean(null));
      
      // Mock create to return the new user
      mockUserModel.create.mockResolvedValueOnce(mockUser);

      // Call the method
      const result = await userService.createUser(email, displayName);

      // Assertions
      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(mockUserModel.create).toHaveBeenCalledWith({
        email,
        displayName,
        sessionHistory: [],
        restaurantInteractions: []
      });
    });
    
    test('should throw error when user already exists', async () => {
      // Input: Email that already exists in database
      // Expected behavior: Error is thrown without creating user
      // Expected output: Error with message 'User already exists'
      
      const email = 'existing@example.com';
      const displayName = 'Existing User';
      
      // Mock existing user
      const existingUser = {
        _id: 'existing-id',
        email,
        displayName
      };
      
      // Mock getUserByEmail to return existing user
      mockUserModel.findOne.mockReturnValueOnce(createMockWithLean(existingUser));
      
      // Call the method and expect it to throw
      await expect(userService.createUser(email, displayName))
        .rejects.toThrow('User already exists');
      
      // Verify create was not called
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });
    
    test('should throw error when email and displayName not provided', async () => {
      // Input: Empty email and displayName
      // Expected behavior: Validation error is thrown
      // Expected output: Error with message 'Email and displayName are required'
      
      await expect(userService.createUser('', ''))
        .rejects.toThrow('Email and displayName are required');
      
      expect(mockUserModel.findOne).not.toHaveBeenCalled();
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });
    
    test('should handle database error during creation', async () => {
      // Input: Valid data but database error occurs
      // Expected behavior: Error is caught and rethrown
      // Expected output: Error with message 'Failed to create user'
      
      const email = 'test@example.com';
      const displayName = 'Test User';
      
      // Mock getUserByEmail to return null (no existing user)
      mockUserModel.findOne.mockReturnValueOnce(createMockWithLean(null));
      
      // Mock create to throw an error
      const dbError = new Error('Database error');
      mockUserModel.create.mockRejectedValueOnce(dbError);
      
      await expect(userService.createUser(email, displayName))
        .rejects.toThrow('Failed to create user');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error creating user:', dbError);
    });

  //   test('should throw error when user already exists', async () => {
  //     // Input: Email that already exists in database
  //     // Expected behavior: Error is thrown after finding existing user
  //     // Expected output: Error with message 'User already exists'
      
  //     // Test data
  //     const email = 'existing@example.com';
  //     const displayName = 'Existing User';
      
  //     // Mock existing user
  //     const existingUser = {
  //       _id: 'existing-id',
  //       email,
  //       displayName
  //     };
      
  //     // Mock getUserByEmail to return an existing user
  //     mockLean.mockResolvedValueOnce(existingUser);

  //     // Call and assert
  //     await expect(userService.createUser(email, displayName))
  //       .rejects.toThrow('User already exists');
      
  //     expect(mockCreate).not.toHaveBeenCalled();
  //   });

  //   test('should throw error when email and displayName not provided', async () => {
  //     // Input: Empty email and displayName
  //     // Expected behavior: Validation error is thrown
  //     // Expected output: Error with message 'Email and displayName are required'
      
  //     await expect(userService.createUser('', ''))
  //       .rejects.toThrow('Email and displayName are required');
        
  //     expect(mockFindOne).not.toHaveBeenCalled();
  //     expect(mockCreate).not.toHaveBeenCalled();
  //   });


  });

  describe('getUserById', () => {
    test('should successfully get a user by ID', async () => {
      // Input: Valid user ID
      // Expected behavior: User is fetched from database
      // Expected output: User object with matching ID
      
      const userId = 'valid-user-id';
      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        displayName: 'Test User'
      };

      mockUserModel.findById.mockReturnValueOnce(createMockWithLean(mockUser));

      const result = await userService.getUserById(userId);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
    });
    
    test('should throw error for invalid user ID format', async () => {
      // Input: Invalid user ID format
      // Expected behavior: Validation error is thrown
      // Expected output: Error with message 'Invalid user ID format'
      
      // Mock mongoose.Types.ObjectId.isValid to return false for this test
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValueOnce(false);
      
      await expect(userService.getUserById('invalid-id'))
        .rejects.toThrow('Invalid user ID format');
      
      expect(mockUserModel.findById).not.toHaveBeenCalled();
    });
    
    test('should return null when user not found', async () => {
      // Input: Valid ID that doesn't exist in database
      // Expected behavior: Null is returned
      // Expected output: null
      
      mockUserModel.findById.mockReturnValueOnce(createMockWithLean(null));
      
      const result = await userService.getUserById('nonexistent-id');
      
      expect(result).toBeNull();
      expect(mockUserModel.findById).toHaveBeenCalledWith('nonexistent-id');
    });
    
    test('should handle database error', async () => {
      // Input: Valid ID but database operation fails
      // Expected behavior: Error is caught and rethrown
      // Expected output: Error with message 'Failed to fetch user by ID'
      
      const userId = 'valid-id';
      const dbError = new Error('Database error');
      
      mockUserModel.findById.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(dbError)
      });
      
      await expect(userService.getUserById(userId))
        .rejects.toThrow('Failed to fetch user by ID');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user by ID:', dbError);
    });
  //     expect(mockFindById).toHaveBeenCalledWith(userId);
  //   });

  //   test('should throw error for invalid user ID', async () => {
  //     // Input: Invalid user ID format
  //     // Expected behavior: Validation error is thrown
  //     // Expected output: Error with message 'Invalid user ID format'
      
  //     const invalidId = 'invalid-id';
      
  //     // Mock isValid to return false for this test
  //     mongoose.Types.ObjectId.isValid.mockReturnValueOnce(false);

  //     await expect(userService.getUserById(invalidId))
  //       .rejects.toThrow('Invalid user ID format');
      
  //     expect(mockFindById).not.toHaveBeenCalled();
  //   });

  //   test('should return null when user not found', async () => {
  //     // Input: ID that doesn't exist in database
  //     // Expected behavior: Database returns null
  //     // Expected output: null result
      
  //     mockLean.mockResolvedValueOnce(null);

  //     const result = await userService.getUserById('nonexistent-id');
      
  //     expect(result).toBeNull();
  //     expect(mockFindById).toHaveBeenCalledWith('nonexistent-id');
  //   });

  //   test('should throw error when database query fails', async () => {
  //     // Input: Valid ID but database operation fails
  //     // Expected behavior: Database error is caught and rethrown
  //     // Expected output: Error with message 'Failed to fetch user by ID'
      
  //     mockLean.mockRejectedValueOnce(new Error('Database error'));

  //     await expect(userService.getUserById('valid-id'))
  //       .rejects.toThrow('Failed to fetch user by ID');
      
  //     expect(consoleErrorSpy).toHaveBeenCalled();
  //     expect(mockFindById).toHaveBeenCalledWith('valid-id');
  //   });
  // });



    test('should throw error when email not provided', async () => {
      // Input: Empty email string
      // Expected behavior: Validation error is thrown
      // Expected output: Error with message 'Email is required'
      
      // No need to mock anything as validation happens before DB call
      await expect(userService.getUserByEmail(''))
        .rejects.toThrow('Email is required');
        
      expect(mockUserModel.findOne).not.toHaveBeenCalled();
    });

    test('should return null when user not found', async () => {
      // Input: Email that doesn't exist in database
      // Expected behavior: Null is returned when no user found
      // Expected output: null
      
      mockUserModel.findOne.mockReturnValueOnce(createMockWithLean(null));

      const result = await userService.getUserByEmail('nonexistent@example.com');
      
      expect(result).toBeNull();
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
    });

    test('should throw error when database query fails', async () => {
      // Input: Valid email but database operation fails
      // Expected behavior: Database error is caught and rethrown
      // Expected output: Error with message 'Failed to fetch user by email'
      
      const email = 'test@example.com';
      const dbError = new Error('Database error');
      
      mockUserModel.findOne.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(dbError)
      });

      await expect(userService.getUserByEmail(email))
        .rejects.toThrow('Failed to fetch user by email');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching user by email:', dbError);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
    });
  });

  describe('updateFCMToken', () => {
    test('should successfully update FCM token', async () => {
      // Input: Valid user ID and FCM token
      // Expected behavior: User's FCM token is updated
      // Expected output: Updated user object
      
      const userId = 'valid-user-id';
      const fcmToken = 'new-fcm-token';
      const updatedUser = {
        _id: userId,
        email: 'test@example.com',
        displayName: 'Test User',
        fcmToken
      };

      mockUserModel.findByIdAndUpdate.mockReturnValueOnce(createMockWithLean(updatedUser));

      const result = await userService.updateFCMToken(userId, fcmToken);

      expect(result).toEqual(updatedUser);
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { fcmToken },
        { new: true }
      );
    });

    test('should throw error for invalid user ID format', async () => {
      // Input: Invalid user ID format
      // Expected behavior: Validation error is thrown
      // Expected output: Error with message 'Invalid user ID format'
      
      // Mock mongoose.Types.ObjectId.isValid to return false for this test
      jest.spyOn(mongoose.Types.ObjectId, 'isValid').mockReturnValueOnce(false);
      
      await expect(userService.updateFCMToken('invalid-id', 'token'))
        .rejects.toThrow('Invalid user ID format');
      
      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('should throw error when FCM token not provided', async () => {
      // Input: Valid user ID but empty FCM token
      // Expected behavior: Validation error is thrown
      // Expected output: Error with message 'FCM token is required'
      
      await expect(userService.updateFCMToken('valid-id', ''))
        .rejects.toThrow('FCM token is required');
      
      expect(mockUserModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test('should throw error when user not found', async () => {
      // Input: Valid user ID but user doesn't exist
      // Expected behavior: Error is thrown
      // Expected output: Error with message 'User not found'
      
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce(createMockWithLean(null));
      
      await expect(userService.updateFCMToken('non-existent-id', 'token'))
        .rejects.toThrow('User not found');
      
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalled();
    });

    test('should handle database error during update', async () => {
      // Input: Valid data but database error occurs
      // Expected behavior: Error is caught and rethrown
      // Expected output: Error with message 'Failed to update FCM token'
      
      const userId = 'valid-id';
      const fcmToken = 'token';
      const dbError = new Error('Database error');
      
      mockUserModel.findByIdAndUpdate.mockReturnValueOnce({
        lean: jest.fn().mockRejectedValue(dbError)
      });
      
      await expect(userService.updateFCMToken(userId, fcmToken))
        .rejects.toThrow('Failed to update FCM token');
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error updating FCM token:', dbError);
    });
  });

});
