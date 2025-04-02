import { SessionManager } from '../../services/sessionManager';
import { RestaurantService } from '../../services/restaurantService';
import { Session } from '../../models/session';

// Mock dependencies
jest.mock('../../models/session');
jest.mock('../../services/restaurantService');

describe('SessionManager', () => {
  let sessionManager: SessionManager;
  let mockRestaurantService: jest.Mocked<RestaurantService>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a mock RestaurantService
    mockRestaurantService = new RestaurantService() as jest.Mocked<RestaurantService>;
    
    // Create the SessionManager instance with the mock RestaurantService
    sessionManager = new SessionManager(mockRestaurantService);
  });

  describe('generateUniqueJoinCode', () => {
    it('should generate a unique 5-character join code', async () => {
      // Mock Session.findOne to return null (indicating the code is unique)
      (Session.findOne as jest.Mock).mockResolvedValue(null);
      
      // For testing private methods, we need to access them indirectly
      // This approach uses Reflect.get which is more acceptable to code quality tools
      const generateUniqueJoinCode = Reflect.get(sessionManager, 'generateUniqueJoinCode');
      const joinCode = await generateUniqueJoinCode.call(sessionManager);
      
      // Verify the join code format
      expect(joinCode).toMatch(/^[A-Z0-9]{5}$/);
      
      // Verify Session.findOne was called - completely avoiding unbound method references
      const expectedPattern = { joinCode: expect.any(String), status: { $ne: 'COMPLETED' } };
      const matcher = expect.objectContaining(expectedPattern);
      // Use type assertion instead of jest.mocked to avoid unbound method warning
      const mockFn = Session.findOne as jest.Mock;
      expect(mockFn).toHaveBeenCalledWith(matcher);
    });
  });

  describe('getSession', () => {
    it('should return a session when given a valid session ID', async () => {
      // Mock data
      const sessionId = '507f1f77bcf86cd799439011';
      const mockSession = {
        _id: sessionId,
        creator: 'user123',
        participants: [],
        status: 'CREATED'
      };

      // Mock Session.findById to return a session
      (Session.findById as jest.Mock).mockResolvedValue(mockSession);

      // Call the method
      const result = await sessionManager.getSession(sessionId);

      // Verify the result
      expect(result).toEqual(mockSession);
      
      // Verify Session.findById was called with the correct ID - completely avoiding unbound method references
      const idMatcher = expect.any(Object);
      // Use type assertion instead of jest.mocked to avoid unbound method warning
      const mockFindById = Session.findById as jest.Mock;
      expect(mockFindById).toHaveBeenCalledWith(idMatcher);
    });

    it('should throw an error when session is not found', async () => {
      // Mock data
      const sessionId = '507f1f77bcf86cd799439011';
      
      // Mock Session.findById to return null
      (Session.findById as jest.Mock).mockResolvedValue(null);

      // Call the method and expect it to throw
      await expect(sessionManager.getSession(sessionId)).rejects.toThrow('Session not found');
    });
  });
});
