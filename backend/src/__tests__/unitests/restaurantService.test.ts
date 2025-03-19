import './mocked_setup'a

// Import dependencies after mocking
import { mockGooglePlacesService, mockRestaurantInstance, mockRestaurantModel } from '../../../TEMP/setup';
import { GooglePlacesService } from '../../services/externalAPIs/googleMaps';

// MUST KEEP. We need to undo the mock from the setup since we are testing the unmocked version
jest.unmock('../../services/restaurantService');
import { RestaurantService } from '../../services/restaurantService';

import { Types } from 'mongoose';
import { Restaurant } from '../../models/restaurant';


describe('RestaurantService', () => {
  // Create an instance of the actual RestaurantService with mocked dependencies
  let restaurantService: RestaurantService;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Initialize the actual RestaurantService with mocked GooglePlacesService
    // Cast the mock to GooglePlacesService type to satisfy TypeScript
    restaurantService = new RestaurantService(mockGooglePlacesService as unknown as GooglePlacesService);

    // Mock console methods
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(console, 'log').mockImplementation(() => { });
  });

  afterEach(() => {
    // Restore console mocks
    jest.restoreAllMocks();
  });

  describe('getRestaurants', () => {
    test('should successfully get restaurants by IDs', async () => {
      // Input: Array of restaurant IDs
      // Expected behavior: Retrieves restaurants matching the IDs
      // Expected output: Array of restaurant objects

      // Mock data
      // In tests, we use string IDs as per the mocking approach in the project
      // The mongoose.Types.ObjectId is mocked as String for simplicity
      const restaurantIds = [
        '507f1f77bcf86cd799439011',
        '507f1f77bcf86cd799439022'
      ];
      const mockRestaurants = [
        { _id: restaurantIds[0], name: 'Restaurant 1' },
        { _id: restaurantIds[1], name: 'Restaurant 2' }
      ];

      // Mock the Restaurant.find method to return our mock data
      // This is necessary because we're testing the actual RestaurantService implementation
      jest.spyOn(Restaurant, 'find').mockResolvedValueOnce(mockRestaurants);

      // Call the method - cast string[] to Types.ObjectId[] as per the mocking approach
      const result = await restaurantService.getRestaurants(restaurantIds as unknown as Types.ObjectId[]);

      // Assertions
      expect(result).toEqual(mockRestaurants);
    });

    test('should handle error during getRestaurants', async () => {
      // Input: Array of restaurant IDs
      // Expected behavior: Handles database error
      // Expected output: Throws error with message 'Failed to get restaurants'

      // Mock data
      const restaurantIds = ['507f1f77bcf86cd799439011'];

      // Mock Restaurant.find to throw an error
      const error = new Error('Database error');
      jest.spyOn(Restaurant, 'find').mockRejectedValueOnce(error);

      // Call and assert
      try {
        await restaurantService.getRestaurants(restaurantIds as unknown as Types.ObjectId[]);
        fail('Expected an error to be thrown');
      } catch (err: any) {
        expect(err.message).toBe('Failed to get restaurants');
        expect(console.error).toHaveBeenCalled();
      }
    });
  });

  describe('getRestaurant', () => {
    test('should successfully get a restaurant by ID', async () => {
      // Input: Restaurant ID
      // Expected behavior: Retrieves restaurant matching the ID
      // Expected output: Restaurant object

      // Mock data
      const restaurantId = '507f1f77bcf86cd799439011';
      const mockRestaurant = { _id: restaurantId, name: 'Restaurant 1' };

      // Mock Restaurant.findOne to return the mock restaurant
      jest.spyOn(Restaurant, 'findOne').mockResolvedValueOnce(mockRestaurant);

      // Call the method
      const result = await restaurantService.getRestaurant(restaurantId as unknown as Types.ObjectId);

      // Assertions
      expect(result).toEqual(mockRestaurant);
    });

    test('should handle error during getRestaurant', async () => {
      // Input: Restaurant ID
      // Expected behavior: Handles database error
      // Expected output: Throws error with message 'Failed to get restaurant'

      // Mock data
      const restaurantId = '507f1f77bcf86cd799439011';

      // Mock Restaurant.findOne to throw an error
      const error = new Error('Database error');
      jest.spyOn(Restaurant, 'findOne').mockRejectedValueOnce(error);

      // Call and assert
      try {
        await restaurantService.getRestaurant(restaurantId as unknown as Types.ObjectId);
        fail('Expected an error to be thrown');
      } catch (err: any) {
        expect(err.message).toBe('Failed to get restaurant');
        expect(console.error).toHaveBeenCalled();
      }
    });
  });

  describe('addRestaurants', () => {
    test('should create restaurants with full details including photos and opening hours', async () => {
      // Input: Location with nearby places that have photos and opening hours
      // Expected behavior: Creates restaurants with all details
      // Expected output: Array of saved restaurants

      // Mock data for nearby places
      const location = { latitude: 49.2827, longitude: -123.1207, radius: 1000 };
      const nearbyPlaces = [
        { place_id: 'place1', name: 'Restaurant 1' }
      ];

      // Mock place details with photos and opening hours
      const placeDetails = {
        name: 'Restaurant 1',
        formatted_address: '123 Main St',
        geometry: { location: { lat: 49.28, lng: -123.12 } },
        formatted_phone_number: '123-456-7890',
        website: 'https://restaurant1.com',
        photos_url: ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'],
        price_level: 2,
        rating: 4.5,
        opening_hours: {
          open_now: true,
          weekday_text: ['Monday: 9AM-9PM', 'Tuesday: 9AM-9PM']
        }
      };

      // Mock saved restaurant
      const savedRestaurant = {
        _id: 'resto1',
        name: 'Restaurant 1'
      };

      // Setup mock implementations
      jest.spyOn(mockGooglePlacesService, 'searchNearby').mockResolvedValueOnce(nearbyPlaces);
      jest.spyOn(mockGooglePlacesService, 'getPlaceDetails').mockResolvedValueOnce(placeDetails);
      jest.spyOn(Restaurant, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(mockRestaurantInstance, 'save').mockResolvedValueOnce(savedRestaurant);

      // Call the method
      const result = await restaurantService.addRestaurants(location);

      // Assertions
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(savedRestaurant);
      expect(mockGooglePlacesService.searchNearby).toHaveBeenCalledWith(
        location.latitude, location.longitude, location.radius, undefined
      );
      expect(mockGooglePlacesService.getPlaceDetails).toHaveBeenCalledWith('place1');
      expect(Restaurant).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Restaurant 1',
        images: {
          primary: 'photo1.jpg',
          gallery: ['photo2.jpg', 'photo3.jpg']
        },
        openingHours: {
          openNow: true,
          weekdayText: ['Monday: 9AM-9PM', 'Tuesday: 9AM-9PM']
        }
      }));
    });

    test('should handle restaurants with no photos', async () => {
      // Input: Location with nearby place that has no photos
      // Expected behavior: Creates restaurant with empty photo arrays
      // Expected output: Array with one saved restaurant

      // Mock data
      const location = { latitude: 49.2827, longitude: -123.1207, radius: 1000 };
      const nearbyPlaces = [{ place_id: 'place3', name: 'Restaurant 3' }];

      // Mock place details with no photos
      const placeDetails = {
        name: 'Restaurant 3',
        formatted_address: '789 Pine St',
        geometry: { location: { lat: 49.30, lng: -123.14 } },
        formatted_phone_number: '555-555-5555',
        website: 'https://restaurant3.com',
        photos_url: null, // No photos
        price_level: 1,
        rating: 3.8,
        opening_hours: {
          open_now: true,
          weekday_text: ['Monday: 8AM-8PM']
        }
      };

      // Mock saved restaurant
      const savedRestaurant = {
        _id: 'resto3',
        name: 'Restaurant 3'
      };

      // Setup mock implementations
      jest.spyOn(mockGooglePlacesService, 'searchNearby').mockResolvedValueOnce(nearbyPlaces);
      jest.spyOn(mockGooglePlacesService, 'getPlaceDetails').mockResolvedValueOnce(placeDetails);
      jest.spyOn(Restaurant, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(mockRestaurantInstance, 'save').mockResolvedValueOnce(savedRestaurant);

      // Call the method
      const result = await restaurantService.addRestaurants(location);

      // Assertions
      expect(result).toHaveLength(1);
      expect(Restaurant).toHaveBeenCalledWith(expect.objectContaining({
        images: {
          primary: '',
          gallery: []
        }
      }));
    });

    test('should handle restaurants with no opening hours', async () => {
      // Input: Location with nearby place that has no opening hours
      // Expected behavior: Creates restaurant with undefined opening hours
      // Expected output: Array with one saved restaurant

      // Mock data
      const location = { latitude: 49.2827, longitude: -123.1207, radius: 1000 };
      const nearbyPlaces = [{ place_id: 'place4', name: 'Restaurant 4' }];

      // Mock place details with no opening hours
      const placeDetails = {
        name: 'Restaurant 4',
        formatted_address: '101 Elm St',
        geometry: { location: { lat: 49.31, lng: -123.15 } },
        formatted_phone_number: null, // No phone
        website: null, // No website
        photos_url: ['photo5.jpg'],
        price_level: null, // No price level
        rating: null, // No rating
        opening_hours: null // No opening hours
      };

      // Mock saved restaurant
      const savedRestaurant = {
        _id: 'resto4',
        name: 'Restaurant 4'
      };

      // Setup mock implementations
      jest.spyOn(mockGooglePlacesService, 'searchNearby').mockResolvedValueOnce(nearbyPlaces);
      jest.spyOn(mockGooglePlacesService, 'getPlaceDetails').mockResolvedValueOnce(placeDetails);
      jest.spyOn(Restaurant, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(mockRestaurantInstance, 'save').mockResolvedValueOnce(savedRestaurant);

      // Call the method
      const result = await restaurantService.addRestaurants(location);

      // Assertions
      expect(result).toHaveLength(1);
      expect(Restaurant).toHaveBeenCalledWith(expect.objectContaining({
        contact: {
          phone: ' ',
          website: ' '
        },
        priceLevel: 0,
        rating: 0,
        openingHours: undefined
      }));
    });

    test('should handle restaurant that already exists', async () => {
      // Input: Location with nearby place that already exists in the database
      // Expected behavior: Skips creation and returns existing restaurant
      // Expected output: Array with one existing restaurant

      // Mock data
      const location = { latitude: 49.2827, longitude: -123.1207, radius: 1000 };
      const nearbyPlaces = [{ place_id: 'place5', name: 'Restaurant 5' }];

      // Mock existing restaurant
      const existingRestaurant = {
        _id: 'resto5',
        name: 'Restaurant 5'
      };

      // Setup mock implementations
      jest.spyOn(mockGooglePlacesService, 'searchNearby').mockResolvedValueOnce(nearbyPlaces);
      jest.spyOn(Restaurant, 'findOne').mockResolvedValueOnce(existingRestaurant);

      // Call the method
      const result = await restaurantService.addRestaurants(location);

      // Assertions
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(existingRestaurant);
      expect(mockGooglePlacesService.getPlaceDetails).not.toHaveBeenCalled();
      expect(Restaurant).not.toHaveBeenCalledWith(expect.anything());
    });

    test('should handle place details not available', async () => {
      // Input: Location with nearby place but details can't be retrieved
      // Expected behavior: Skips the place and continues
      // Expected output: Empty array (no restaurants created)

      // Mock data
      const location = { latitude: 49.2827, longitude: -123.1207, radius: 1000 };
      const nearbyPlaces = [{ place_id: 'place6', name: 'Restaurant 6' }];

      // Setup mock implementations
      jest.spyOn(mockGooglePlacesService, 'searchNearby').mockResolvedValueOnce(nearbyPlaces);
      jest.spyOn(mockGooglePlacesService, 'getPlaceDetails').mockResolvedValueOnce(null);
      jest.spyOn(Restaurant, 'findOne').mockResolvedValueOnce(null);

      // Call the method
      const result = await restaurantService.addRestaurants(location);

      // Assertions
      expect(result).toEqual([]);
      expect(mockGooglePlacesService.getPlaceDetails).toHaveBeenCalledWith('place6');
      expect(console.error).toHaveBeenCalled();
      expect(Restaurant).not.toHaveBeenCalled();
    });

    test('should handle error during addRestaurants', async () => {
      // Input: Valid location but an error occurs
      // Expected behavior: Error is caught and rethrown
      // Expected output: Error with message 'Failed to create restaurants'

      // Mock data
      const location = { latitude: 49.2827, longitude: -123.1207, radius: 1000 };
      const error = new Error('API error');

      // Setup mock implementation to throw an error
      jest.spyOn(mockGooglePlacesService, 'searchNearby').mockRejectedValueOnce(error);

      // Call and assert
      try {
        await restaurantService.addRestaurants(location);
        fail('Expected an error to be thrown');
      } catch (err: any) {
        expect(err.message).toBe('Failed to create restaurants');
        expect(console.error).toHaveBeenCalled();
      }
    });
  });
});
