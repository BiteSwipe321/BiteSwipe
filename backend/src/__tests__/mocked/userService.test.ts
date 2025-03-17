import { UserService } from '../../services/userService';
import {mockUserModel} from '../setup';

// MUST KEEP. We need to undo the mock from the setup since we are testing the unmocked version
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

  describe('getUserByEmail', () => {
    test('should successfully get a user by email', async () => {
      // Input: Valid email address
      // Expected behavior: User is fetched from database
      // Expected output: User object with matching email

      const email = 'test@example.com';
      const mockUser = {
        _id: 'user-id',
        email,
        displayName: 'Test User'
      };

      // Set up the mock implementation with proper chaining
      mockUserModel.findOne.mockReturnValueOnce(createMockWithLean(mockUser));

      const result = await userService.getUserByEmail(email);

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
    });
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

  //   test('should throw error when database fails', async () => {
  //     // Input: Valid email and displayName but database operation fails
  //     // Expected behavior: Database error is caught and rethrown
  //     // Expected output: Error with message 'Failed to create user'
      
  //     // Mock getUserByEmail to return null (no existing user)
  //     mockLean.mockResolvedValueOnce(null);
      
  //     // Mock create to throw an error
  //     mockCreate.mockRejectedValueOnce(new Error('Database error'));

  //     // Call and assert
  //     await expect(userService.createUser('test@example.com', 'Test User'))
  //       .rejects.toThrow('Failed to create user');
      
  //     expect(consoleErrorSpy).toHaveBeenCalled();
  //   });
  });

  // describe('getUserById', () => {
  //   test('should successfully get a user by ID', async () => {
  //     // Input: Valid user ID
  //     // Expected behavior: User is fetched from database
  //     // Expected output: User object with matching ID
      
  //     const userId = 'valid-id';
  //     const mockUser = {
  //       _id: userId,
  //       email: 'test@example.com',
  //       displayName: 'Test User'
  //     };

  //     // Set up the mock implementation for findById
  //     mockLean.mockResolvedValueOnce(mockUser);

  //     const result = await userService.getUserById(userId);

  //     expect(result).toEqual(mockUser);
  //     expect(mockObjectIdIsValid).toHaveBeenCalledWith(userId);
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



    // test('should throw error when email not provided', async () => {
    //   // Input: Empty email string
    //   // Expected behavior: Validation error is thrown
    //   // Expected output: Error with message 'Email is required'
      
    //   // No need to mock anything as validation happens before DB call
    //   await expect(userService.getUserByEmail(''))
    //     .rejects.toThrow('Email is required');
        
    //   expect(mockFindOne).not.toHaveBeenCalled();
    // });

    // test('should return null when user not found', async () => {
    //   // Input: Email that doesn't exist in database
    //   // Expected behavior: Database returns null
    //   // Expected output: null result
      
    //   mockLean.mockResolvedValueOnce(null);

    //   const result = await userService.getUserByEmail('nonexistent@example.com');
      
    //   expect(result).toBeNull();
    //   expect(mockFindOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
    // });

    // test('should throw error when database query fails', async () => {
    //   // Input: Valid email but database operation fails
    //   // Expected behavior: Database error is caught and rethrown
    //   // Expected output: Error with message 'Failed to fetch user by email'
      
    //   mockLean.mockRejectedValueOnce(new Error('Database error'));

    //   await expect(userService.getUserByEmail('test@example.com'))
    //     .rejects.toThrow('Failed to fetch user by email');
      
    //   expect(consoleErrorSpy).toHaveBeenCalled();
    //   expect(mockFindOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    // });
  

  // describe('updateFCMToken', () => {
  //   test('should successfully update FCM token', async () => {
  //     // Input: Valid user ID and FCM token
  //     // Expected behavior: User's FCM token is updated
  //     // Expected output: Updated user object with new FCM token
      
  //     const userId = 'user-id';
  //     const fcmToken = 'new-fcm-token';
  //     const updatedUser = {
  //       _id: userId,
  //       email: 'test@example.com',
  //       displayName: 'Test User',
  //       fcmToken
  //     };

  //     mockLean.mockResolvedValueOnce(updatedUser);

  //     const result = await userService.updateFCMToken(userId, fcmToken);

  //     expect(result).toEqual(updatedUser);
  //     expect(mockObjectIdIsValid).toHaveBeenCalledWith(userId);
  //     expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
  //       userId,
  //       { fcmToken },
  //       { new: true }
  //     );
  //   });

  //   test('should throw error for invalid user ID', async () => {
  //     // Input: Invalid user ID format
  //     // Expected behavior: Validation error is thrown
  //     // Expected output: Error with message 'Invalid user ID format'
      
  //     // Mock isValid to return false for this test
  //     mockObjectIdIsValid.mockReturnValueOnce(false);

  //     await expect(userService.updateFCMToken('invalid-id', 'token'))
  //       .rejects.toThrow('Invalid user ID format');
        
  //     expect(mockFindByIdAndUpdate).not.toHaveBeenCalled();
  //   });

  //   test('should throw error when FCM token not provided', async () => {
  //     // Input: Valid user ID but empty FCM token
  //     // Expected behavior: Validation error is thrown
  //     // Expected output: Error with message 'FCM token is required'
      
  //     await expect(userService.updateFCMToken('user-id', ''))
  //       .rejects.toThrow('FCM token is required');
        
  //     expect(mockFindByIdAndUpdate).not.toHaveBeenCalled();
  //   });

  //   test('should throw error when user not found', async () => {
  //     // Input: Valid ID that doesn't exist in database
  //     // Expected behavior: Error is thrown when user not found
  //     // Expected output: Error with message 'User not found'
      
  //     mockLean.mockResolvedValueOnce(null);

  //     await expect(userService.updateFCMToken('nonexistent-id', 'token'))
  //       .rejects.toThrow('User not found');
        
  //     expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
  //       'nonexistent-id',
  //       { fcmToken: 'token' },
  //       { new: true }
  //     );
  //   });

  //   test('should throw error when database update fails', async () => {
  //     // Input: Valid inputs but database operation fails
  //     // Expected behavior: Database error is caught and rethrown
  //     // Expected output: Error with message 'Failed to update FCM token'
      
  //     mockLean.mockRejectedValueOnce(new Error('Database error'));

  //     await expect(userService.updateFCMToken('user-id', 'token'))
  //       .rejects.toThrow('Failed to update FCM token');
      
  //     expect(consoleErrorSpy).toHaveBeenCalled();
  //     expect(mockFindByIdAndUpdate).toHaveBeenCalledWith(
  //       'user-id',
  //       { fcmToken: 'token' },
  //       { new: true }
  //     );
  //   });
  // });
});
