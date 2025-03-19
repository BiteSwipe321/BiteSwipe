import '../mocked/mocked_setup';

// Mock the Restaurant model
jest.mock('../../models/restaurant', () => {
  return {
    Restaurant: {
      findOne: jest.fn(),
      find: jest.fn(),
      prototype: {
        save: jest.fn()
      }
    }
  };
});

// Mock the GooglePlacesService
jest.mock('../../services/externalAPIs/googleMaps', () => {
  return {
    GooglePlacesService: jest.fn().mockImplementation(() => ({
      searchNearby: jest.fn(),
      getPlaceDetails: jest.fn()
    }))
  };
});

// Import after mocking
import { Restaurant } from '../../models/restaurant';
import { GooglePlacesService } from '../../services/externalAPIs/googleMaps';
import { RestaurantService } from '../../services/restaurantService';

describe('RestaurantService', () => {
  let restaurantService: RestaurantService;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Mock console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Create a new instance of RestaurantService for each test
    restaurantService = new RestaurantService();
  });
  
  afterEach(() => {
    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  describe('getRestaurants', () => {
    test('should successfully get restaurants by IDs', async () => {
      // Input: Array of restaurant IDs
      // Expected behavior: Database is queried for restaurants with matching IDs
      // Expected output: Array of restaurant objects
      
      // Mock data
      const restaurantIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439022'
      ];
      
      const mockRestaurants = [
        { _id: restaurantIds[0], name: 'Restaurant 1' },
        { _id: restaurantIds[1], name: 'Restaurant 2' }
      ];
      
      // Setup mock implementation
      (Restaurant.find as jest.Mock).mockResolvedValue(mockRestaurants);
      
      // Call the method
      const result = await restaurantService.getRestaurants(restaurantIds);
      
      // Assertions
      expect(result).toEqual(mockRestaurants);
      expect(Restaurant.find).toHaveBeenCalledWith({ _id: { $in: restaurantIds } });
    });

    test('should handle error during getRestaurants', async () => {
      // Input: Array of restaurant IDs
      // Expected behavior: Database error is caught and rethrown
      // Expected output: Error with message 'Failed to get restaurants'
      
      // Mock data
      const restaurantIds = ['507f1f77bcf86cd799439011'];
      
      // Setup mock implementation to throw an error
      const error = new Error('Database error');
      (Restaurant.find as jest.Mock).mockRejectedValue(error);
      
      // Call and assert
      await expect(restaurantService.getRestaurants(restaurantIds))
        .rejects.toThrow('Failed to get restaurants');
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    test('should return empty array when no IDs are provided', async () => {
      // Input: Empty array of restaurant IDs
      // Expected behavior: No database query is made
      // Expected output: Empty array
      
      // Call the method
      const result = await restaurantService.getRestaurants([]);
      
      // Assertions
      expect(result).toEqual([]);
      expect(Restaurant.find).not.toHaveBeenCalled();
    });
  });

  describe('getRestaurant', () => {
    test('should successfully get a restaurant by ID', async () => {
      // Input: Valid restaurant ID
      // Expected behavior: Database is queried for restaurant with matching ID
      // Expected output: Restaurant object
      
      // Mock data
      const restaurantId = '507f1f77bcf86cd799439011';
      const mockRestaurant = { _id: restaurantId, name: 'Restaurant 1' };
      
      // Setup mock implementation
      (Restaurant.findOne as jest.Mock).mockResolvedValue(mockRestaurant);
      
      // Call the method
      const result = await restaurantService.getRestaurant(restaurantId);
      
      // Assertions
      expect(result).toEqual(mockRestaurant);
      expect(Restaurant.findOne).toHaveBeenCalledWith({ _id: restaurantId });
    });

    test('should handle error during getRestaurant', async () => {
      // Input: Valid restaurant ID
      // Expected behavior: Database error is caught and rethrown
      // Expected output: Error with message 'Failed to get restaurant'
      
      // Mock data
      const restaurantId = '507f1f77bcf86cd799439011';
      
      // Setup mock implementation to throw an error
      const error = new Error('Database error');
      (Restaurant.findOne as jest.Mock).mockRejectedValue(error);
      
      // Call and assert
      await expect(restaurantService.getRestaurant(restaurantId))
        .rejects.toThrow('Failed to get restaurant');
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    
    test('should return null when restaurant is not found', async () => {
      // Input: Valid restaurant ID that doesn't exist
      // Expected behavior: Database returns null
      // Expected output: null
      
      // Mock data
      const restaurantId = '507f1f77bcf86cd799439011';
      
      // Setup mock implementation
      (Restaurant.findOne as jest.Mock).mockResolvedValue(null);
      
      // Call the method
      const result = await restaurantService.getRestaurant(restaurantId);
      
      // Assertions
      expect(result).toBeNull();
      expect(Restaurant.findOne).toHaveBeenCalledWith({ _id: restaurantId });
    });
  });

  describe('searchNearbyRestaurants', () => {
    test('should successfully search nearby restaurants', async () => {
      // Input: Location and radius
      // Expected behavior: GooglePlacesService is called to search nearby
      // Expected output: Array of restaurant objects
      
      // Mock data
      const location = { latitude: 49.2827, longitude: -123.1207 };
      const radius = 5000;
      const mockPlaces = [
        { place_id: 'place1', name: 'Restaurant 1' },
        { place_id: 'place2', name: 'Restaurant 2' }
      ];
      
      // Setup mock implementation
      const mockGooglePlacesService = new GooglePlacesService();
      (mockGooglePlacesService.searchNearby as jest.Mock).mockResolvedValue(mockPlaces);
      (GooglePlacesService as jest.Mock).mockImplementation(() => mockGooglePlacesService);
      
      // Call the method
      const result = await restaurantService.searchNearbyRestaurants(location, radius);
      
      // Assertions
      expect(result).toEqual(mockPlaces);
      expect(mockGooglePlacesService.searchNearby).toHaveBeenCalledWith(location, radius);
    });
    
    test('should handle error during searchNearbyRestaurants', async () => {
      // Input: Location and radius
      // Expected behavior: GooglePlacesService error is caught and rethrown
      // Expected output: Error with message 'Failed to search nearby restaurants'
      
      // Mock data
      const location = { latitude: 49.2827, longitude: -123.1207 };
      const radius = 5000;
      
      // Setup mock implementation to throw an error
      const error = new Error('API error');
      const mockGooglePlacesService = new GooglePlacesService();
      (mockGooglePlacesService.searchNearby as jest.Mock).mockRejectedValue(error);
      (GooglePlacesService as jest.Mock).mockImplementation(() => mockGooglePlacesService);
      
      // Call and assert
      await expect(restaurantService.searchNearbyRestaurants(location, radius))
        .rejects.toThrow('Failed to search nearby restaurants');
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('getRestaurantDetails', () => {
    test('should successfully get restaurant details', async () => {
      // Input: Place ID
      // Expected behavior: GooglePlacesService is called to get details
      // Expected output: Restaurant details object
      
      // Mock data
      const placeId = 'place1';
      const mockDetails = { 
        place_id: placeId, 
        name: 'Restaurant 1',
        formatted_address: '123 Main St',
        photos: [{ photo_reference: 'photo1' }]
      };
      
      // Setup mock implementation
      const mockGooglePlacesService = new GooglePlacesService();
      (mockGooglePlacesService.getPlaceDetails as jest.Mock).mockResolvedValue(mockDetails);
      (GooglePlacesService as jest.Mock).mockImplementation(() => mockGooglePlacesService);
      
      // Call the method
      const result = await restaurantService.getRestaurantDetails(placeId);
      
      // Assertions
      expect(result).toEqual(mockDetails);
      expect(mockGooglePlacesService.getPlaceDetails).toHaveBeenCalledWith(placeId);
    });
    
    test('should handle error during getRestaurantDetails', async () => {
      // Input: Place ID
      // Expected behavior: GooglePlacesService error is caught and rethrown
      // Expected output: Error with message 'Failed to get restaurant details'
      
      // Mock data
      const placeId = 'place1';
      
      // Setup mock implementation to throw an error
      const error = new Error('API error');
      const mockGooglePlacesService = new GooglePlacesService();
      (mockGooglePlacesService.getPlaceDetails as jest.Mock).mockRejectedValue(error);
      (GooglePlacesService as jest.Mock).mockImplementation(() => mockGooglePlacesService);
      
      // Call and assert
      await expect(restaurantService.getRestaurantDetails(placeId))
        .rejects.toThrow('Failed to get restaurant details');
      
      // Verify console.error was called
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
  });
});
