import { UserService } from '../../services/userService';
import { UserModel } from '../../models/user';
import mongoose from 'mongoose';

// Mock console methods to prevent logs during tests
const originalConsoleError = console.error;

describe('UserService - Unmocked Tests', () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
    userService = new UserService();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('createUser', () => {
    // Input: Valid email and displayName
    // Expected behavior: Should create a new user when email doesn't exist
    // Expected output: New user object
    test('should create a new user successfully', async () => {
      // Setup: Mock the user to be returned
      const mockUser = {
        _id: 'new-user-id',
        email: 'new@example.com',
        displayName: 'New User',
        sessionHistory: [],
        restaurantInteractions: []
      };
      
      // Mock findOne to return null (user doesn't exist)
      jest.spyOn(UserModel, 'findOne').mockResolvedValueOnce(null);
      
      // Setup: Mock the save method
      const saveMock = jest.fn().mockResolvedValueOnce(mockUser);
      
      // Mock the constructor behavior
      const originalModelImplementation = mongoose.model;
      (mongoose.model as jest.Mock).mockImplementationOnce(() => {
        return function() {
          return { save: saveMock };
        };
      });
      
      // Execute: Call the method
      const result = await userService.createUser('new@example.com', 'New User');
      
      // Restore original implementation
      (mongoose.model as jest.Mock).mockImplementation(originalModelImplementation);
      
      // Assert: Verify the result
      expect(result).toEqual(mockUser);
      expect(UserModel.findOne).toHaveBeenCalledWith({ email: 'new@example.com' });
      expect(saveMock).toHaveBeenCalled();
    });
    
    // // Input: Email that already exists
    // // Expected behavior: Should throw an error when user already exists
    // // Expected output: Error with message 'User already exists'
    // test('should throw error when user already exists', async () => {
    //   // Setup: Mock getUserByEmail to return an existing user
    //   const existingUser = {
    //     _id: 'existing-user-id',
    //     email: 'existing@example.com',
    //     displayName: 'Existing User'
    //   };
      
    //   // Mock the getUserByEmail method to return an existing user
    //   mockUserService.getUserByEmail.mockResolvedValueOnce(existingUser);
      
    //   // Mock createUser to throw an error
    //   const error = new Error('User already exists');
    //   mockUserService.createUser.mockRejectedValueOnce(error);
      
    //   // Execute & Assert: Call method and expect it to throw
    //   await expect(userService.createUser('existing@example.com', 'New User'))
    //     .rejects.toThrow('User already exists');
      
    //   // Verify method calls
    //   expect(mockUserService.getUserByEmail).toHaveBeenCalledWith('existing@example.com');
    // });
    
    // // Input: Valid email and displayName
    // // Expected behavior: Should throw an error when save operation fails
    // // Expected output: Error is logged and thrown
    // test('should handle database error during user creation', async () => {
    //   // Setup: Mock getUserByEmail to return null (user doesn't exist)
    //   mockUserService.getUserByEmail.mockResolvedValueOnce(null);
      
    //   // Setup: Mock createUser to throw a database error
    //   const dbError = new Error('Database connection error during save');
    //   mockUserService.createUser.mockImplementationOnce(() => {
    //     console.error('Error creating user:', dbError);
    //     throw dbError;
    //   });
      
    //   // Execute & Assert: Call method and expect it to throw
    //   await expect(userService.createUser('new@example.com', 'New User'))
    //     .rejects.toThrow();
      
    //   // Verify error is logged
    //   expect(console.error).toHaveBeenCalledWith('Error creating user:', expect.any(Error));
    //   expect(mockUserService.getUserByEmail).toHaveBeenCalledWith('new@example.com');
    // });
  });

  // describe('getUserByEmail', () => {
  //   // Input: Valid email
  //   // Expected behavior: Should return a user when found
  //   // Expected output: User object
  //   test('should return user when found by email', async () => {
  //     // Setup: Mock the user to be returned
  //     const mockUser = {
  //       _id: 'user-id',
  //       email: 'test@example.com',
  //       displayName: 'Test User'
  //     };
      
  //     // Mock getUserByEmail to return the user
  //     mockUserService.getUserByEmail.mockResolvedValueOnce(mockUser);
      
  //     // Execute: Call the method
  //     const result = await userService.getUserByEmail('test@example.com');
      
  //     // Assert: Verify the result
  //     expect(result).toEqual(mockUser);
  //     expect(mockUserService.getUserByEmail).toHaveBeenCalledWith('test@example.com');
  //   });
    
  //   // Input: Email that doesn't exist
  //   // Expected behavior: Should return null when user not found
  //   // Expected output: null
  //   test('should return null when user not found by email', async () => {
  //     // Mock getUserByEmail to return null
  //     mockUserService.getUserByEmail.mockResolvedValueOnce(null);
      
  //     // Execute: Call the method
  //     const result = await userService.getUserByEmail('nonexistent@example.com');
      
  //     // Assert: Verify the result
  //     expect(result).toBeNull();
  //     expect(mockUserService.getUserByEmail).toHaveBeenCalledWith('nonexistent@example.com');
  //   });
    
  //   // Input: Valid email
  //   // Expected behavior: Should throw an error when getUserByEmail encounters a database error
  //   // Expected output: Error is logged and thrown
  //   test('should throw error when database operation fails', async () => {
  //     // Setup: Mock getUserByEmail to throw a database error
  //     const dbError = new Error('Database connection error');
  //     mockUserService.getUserByEmail.mockImplementationOnce(() => {
  //       console.error('Error getting user by email:', dbError);
  //       throw dbError;
  //     });
      
  //     // Execute & Assert: Call method and expect it to throw
  //     await expect(userService.getUserByEmail('test@example.com'))
  //       .rejects.toThrow();
      
  //     // Verify error is logged
  //     expect(console.error).toHaveBeenCalledWith('Error getting user by email:', expect.any(Error));
  //     expect(mockUserService.getUserByEmail).toHaveBeenCalledWith('test@example.com');
  //   });
  // });

  // describe('updateFCMToken', () => {
  //   // Input: Valid userId and FCM token
  //   // Expected behavior: Should update user's FCM token
  //   // Expected output: Updated user object
  //   test('should update FCM token for a valid user', async () => {
  //     const mockUpdatedUser = {
  //       _id: '507f1f77bcf86cd799439011',
  //       email: 'user@example.com',
  //       displayName: 'Test User',
  //       fcmToken: 'new-token-123',
  //       sessionHistory: [],
  //       restaurantInteractions: []
  //     };
      
  //     // Mock updateFCMToken to return the updated user
  //     mockUserService.updateFCMToken.mockResolvedValueOnce(mockUpdatedUser);
      
  //     // Execute: Call the method
  //     const result = await userService.updateFCMToken('507f1f77bcf86cd799439011', 'new-token-123');
      
  //     // Assert: Verify the result
  //     expect(result).toEqual(mockUpdatedUser);
  //     expect(mockUserService.updateFCMToken).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'new-token-123');
  //   });
    
  //   // Input: Valid userId but user not found
  //   // Expected behavior: Should throw an error when user is not found
  //   // Expected output: Error with message 'User not found'
  //   test('should throw error when user is not found', async () => {
  //     // Mock updateFCMToken to throw a 'User not found' error
  //     const error = new Error('User not found');
  //     mockUserService.updateFCMToken.mockRejectedValueOnce(error);
      
  //     // Execute & Assert: Call method and expect it to throw
  //     await expect(userService.updateFCMToken('507f1f77bcf86cd799439011', 'new-token-123'))
  //       .rejects.toThrow('User not found');
      
  //     // Verify method calls
  //     expect(mockUserService.updateFCMToken).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'new-token-123');
  //   });
    
  //   // Input: Invalid userId format
  //   // Expected behavior: Should throw an error when userId is invalid
  //   // Expected output: Error with message 'Invalid user ID format'
  //   test('should throw error when userId is invalid', async () => {
  //     // Mock updateFCMToken to throw an 'Invalid user ID format' error
  //     const error = new Error('Invalid user ID format');
  //     mockUserService.updateFCMToken.mockRejectedValueOnce(error);
      
  //     // Execute & Assert: Call method and expect it to throw
  //     await expect(userService.updateFCMToken('invalid-id', 'new-token-123'))
  //       .rejects.toThrow('Invalid user ID format');
      
  //     // Verify method calls
  //     expect(mockUserService.updateFCMToken).toHaveBeenCalledWith('invalid-id', 'new-token-123');
  //   });
    
  //   // Input: Valid userId but database error occurs
  //   // Expected behavior: Should handle database error during update
  //   // Expected output: Error is logged and thrown
  //   test('should handle database error during update', async () => {
  //     // Mock updateFCMToken to throw a database error
  //     const dbError = new Error('Database connection error');
  //     mockUserService.updateFCMToken.mockImplementationOnce(() => {
  //       console.error('Error updating FCM token:', dbError);
  //       throw dbError;
  //     });
      
  //     // Execute & Assert: Call method and expect it to throw
  //     await expect(userService.updateFCMToken('507f1f77bcf86cd799439011', 'new-token-123'))
  //       .rejects.toThrow();
      
  //     // Verify error is logged
  //     expect(console.error).toHaveBeenCalledWith('Error updating FCM token:', expect.any(Error));
  //     expect(mockUserService.updateFCMToken).toHaveBeenCalledWith('507f1f77bcf86cd799439011', 'new-token-123');
  //   });
  // });
});
