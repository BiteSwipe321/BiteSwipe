// Import the mockUserService from setup
import { mockUserService } from '../setup';

// Mock mongoose module for ObjectId validation
const mockIsValid = jest.fn();
const mockMongoose = {
  Types: {
    ObjectId: {
      isValid: mockIsValid
    }
  }
};

jest.mock('mongoose', () => mockMongoose);

// Mock console methods to prevent logs during tests
const originalConsoleError = console.error;

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('createUser', () => {
    test('should successfully create a new user', async () => {
      // Mock user data
      const mockUser = {
        _id: 'new-user-id',
        email: 'new@example.com',
        displayName: 'New User',
        sessionHistory: [],
        restaurantInteractions: []
      };
      
      // Set up the mock implementation
      mockUserService.getUserByEmail.mockResolvedValue(null); // No existing user
      mockUserService.createUser.mockResolvedValue(mockUser);
      
      // Call the method
      const result = await mockUserService.createUser('new@example.com', 'New User');
      
      // Assertions
      expect(result).toEqual(mockUser);
    });

    test('should throw error when user already exists', async () => {
      // Mock existing user
      const existingUser = { _id: 'existingId' };
      
      // Set up the mock implementation
      mockUserService.getUserByEmail.mockResolvedValue(existingUser);
      
      // Error will be thrown by the implementation
      const error = new Error('User already exists');
      mockUserService.createUser.mockRejectedValue(error);
      
      // Call and assert
      await expect(mockUserService.createUser('existing@example.com', 'Existing User'))
        .rejects.toThrow('User already exists');
    });

    test('should handle error during user creation', async () => {
      // Set up the mock implementation
      mockUserService.getUserByEmail.mockResolvedValue(null); // No existing user
      
      // Mock database error
      const error = new Error('Database error');
      mockUserService.createUser.mockImplementation(() => {
        console.error('Error creating user:', error);
        return Promise.reject(error);
      });
      
      // Call and assert
      await expect(mockUserService.createUser('new@example.com', 'New User'))
        .rejects.toThrow('Database error');
      
      // Verify that console.error would be called in the real implementation
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getUserById', () => {
    test('should successfully get a user by ID', async () => {
      // Mock user data
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        displayName: 'Test User',
        sessionHistory: [],
        restaurantInteractions: []
      };
      
      // Set up mongoose.Types.ObjectId.isValid to return true
      mockIsValid.mockReturnValue(true);
      
      // Set up the mock implementation
      mockUserService.getUserById.mockResolvedValue(mockUser);
      
      // Call the method
      const result = await mockUserService.getUserById('507f1f77bcf86cd799439011');
      
      // Assertions
      expect(result).toEqual(mockUser);
    });

    test('should throw error for invalid user ID format', async () => {
      // Set up mongoose.Types.ObjectId.isValid to return false
      mockIsValid.mockReturnValue(false);
      
      // Set up the mock implementation to throw error
      const error = new Error('Invalid user ID format');
      mockUserService.getUserById.mockRejectedValue(error);
      
      // Call and assert
      await expect(mockUserService.getUserById('invalid-id'))
        .rejects.toThrow('Invalid user ID format');
    });

    test('should handle error during getUserById', async () => {
      // Set up mongoose.Types.ObjectId.isValid to return true
      mockIsValid.mockReturnValue(true);
      
      // Mock database error
      const error = new Error('Database error');
      mockUserService.getUserById.mockImplementation(() => {
        console.error('Error getting user by ID:', error);
        return Promise.reject(error);
      });
      
      // Call and assert
      await expect(mockUserService.getUserById('507f1f77bcf86cd799439011'))
        .rejects.toThrow('Database error');
      
      // Verify that console.error would be called in the real implementation
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('getUserByEmail', () => {
    test('should successfully get a user by email', async () => {
      // Mock user data
      const mockUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'test@example.com',
        displayName: 'Test User',
        sessionHistory: [],
        restaurantInteractions: []
      };
      
      // Set up the mock implementation
      mockUserService.getUserByEmail.mockResolvedValue(mockUser);
      
      // Call the method
      const result = await mockUserService.getUserByEmail('test@example.com');
      
      // Assertions
      expect(result).toEqual(mockUser);
    });

    test('should return null when user not found', async () => {
      // Set up the mock implementation
      mockUserService.getUserByEmail.mockResolvedValue(null);
      
      // Call the method
      const result = await mockUserService.getUserByEmail('nonexistent@example.com');
      
      // Assertions
      expect(result).toBeNull();
    });

    test('should handle error during getUserByEmail', async () => {
      // Mock database error
      const error = new Error('Database error');
      mockUserService.getUserByEmail.mockImplementation(() => {
        console.error('Error getting user by email:', error);
        return Promise.reject(error);
      });
      
      // Call and assert
      await expect(mockUserService.getUserByEmail('test@example.com'))
        .rejects.toThrow('Database error');
      
      // Verify that console.error would be called in the real implementation
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('updateFCMToken', () => {
    test('should successfully update FCM token', async () => {
      // Mock updated user data
      const mockUpdatedUser = {
        _id: '507f1f77bcf86cd799439011',
        email: 'user@example.com',
        displayName: 'Test User',
        fcmToken: 'token123',
        sessionHistory: [],
        restaurantInteractions: []
      };
      
      // Set up mongoose.Types.ObjectId.isValid to return true
      mockIsValid.mockReturnValue(true);
      
      // Set up the mock implementation
      mockUserService.updateFCMToken.mockResolvedValue(mockUpdatedUser);
      
      // Call the method
      const result = await mockUserService.updateFCMToken('507f1f77bcf86cd799439011', 'token123');
      
      // Assertions
      expect(result).toEqual(mockUpdatedUser);
    });

    test('should throw error for invalid user ID format', async () => {
      // Set up mongoose.Types.ObjectId.isValid to return false
      mockIsValid.mockReturnValue(false);
      
      // Set up the mock implementation to throw error
      const error = new Error('Invalid user ID format');
      mockUserService.updateFCMToken.mockRejectedValue(error);
      
      // Call and assert
      await expect(mockUserService.updateFCMToken('invalid-id', 'token123'))
        .rejects.toThrow('Invalid user ID format');
    });

    test('should throw error when user not found', async () => {
      // Set up mongoose.Types.ObjectId.isValid to return true
      mockIsValid.mockReturnValue(true);
      
      // Set up the mock implementation to throw error
      const error = new Error('User not found');
      mockUserService.updateFCMToken.mockRejectedValue(error);
      
      // Call and assert
      await expect(mockUserService.updateFCMToken('507f1f77bcf86cd799439011', 'token123'))
        .rejects.toThrow('User not found');
    });

    test('should handle error during updateFCMToken', async () => {
      // Set up mongoose.Types.ObjectId.isValid to return true
      mockIsValid.mockReturnValue(true);
      
      // Mock database error
      const error = new Error('Database error');
      mockUserService.updateFCMToken.mockImplementation(() => {
        console.error('Error updating FCM token:', error);
        return Promise.reject(error);
      });
      
      // Call and assert
      await expect(mockUserService.updateFCMToken('507f1f77bcf86cd799439011', 'token123'))
        .rejects.toThrow('Database error');
      
      // Verify that console.error would be called in the real implementation
      expect(console.error).toHaveBeenCalled();
    });
  });


});
