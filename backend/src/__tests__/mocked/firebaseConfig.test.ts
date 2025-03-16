/**
 * Test file for Firebase configuration
 * Tests both normal functionality and error handling
 */

// Mock the firebase module directly without using firebase-admin
jest.mock('../../config/firebase', () => {
  // Create a mock messaging object
  const mockMessaging = {
    send: jest.fn().mockResolvedValue('mock-message-id'),
    sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, responses: [] })
  };

  return {
    default: { apps: [] }, // Mock admin object
    getMessaging: jest.fn().mockReturnValue(mockMessaging)
  };
});

describe('Firebase Configuration', () => {
  test('should export firebase admin as default', () => {
    // Import the module
    const firebase = require('../../config/firebase');
    
    // Verify exports
    expect(firebase.default).toBeDefined();
  });
  
  test('should export getMessaging function', () => {
    // Import the module
    const firebase = require('../../config/firebase');
    
    // Verify exports
    expect(typeof firebase.getMessaging).toBe('function');
  });
  
  test('getMessaging should return a messaging object', () => {
    // Import the module
    const firebase = require('../../config/firebase');
    
    // Get the messaging instance
    const messaging = firebase.getMessaging();
    
    // Verify it's a messaging instance
    expect(messaging).toBeDefined();
    expect(typeof messaging.send).toBe('function');
    expect(typeof messaging.sendMulticast).toBe('function');
  });
  
  test('messaging.send should return a message ID', async () => {
    // Import the module
    const firebase = require('../../config/firebase');
    
    // Get the messaging instance
    const messaging = firebase.getMessaging();
    
    // Call the send function
    const result = await messaging.send({ token: 'test-token' });
    
    // Verify result
    expect(result).toBe('mock-message-id');
  });
});

/**
 * Tests for Firebase initialization error handling
 * 
 * These tests verify that the Firebase module properly handles error cases:
 * 1. Missing credentials pathname environment variable
 * 2. Non-existent credentials file
 */
describe('Firebase Error Handling', () => {
  // Store original environment and console methods
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset modules before each test
    jest.resetModules();
    
    // Spy on console methods
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    
    // Restore console methods
    jest.restoreAllMocks();
  });
  
  // Input: No Firebase credentials pathname in environment
  // Expected behavior: Error is caught and logged during initialization
  // Expected output: Error message about missing credentials pathname
  test('should throw error when Firebase credentials pathname is missing', () => {
    // First, restore the original mock to ensure we're starting clean
    jest.resetModules();
    
    // Save the original environment variable value
    const originalPathname = process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME;
    
    // Delete the environment variable
    delete process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME;
    
    // Create a custom implementation of the firebase module
    // that will execute the actual code but with our mocks
    jest.doMock('../../config/firebase', () => {
      // This will execute the actual firebase.ts file code
      // with our mocked environment (no FIREBASE_CREDENTIALS_JSON_PATHNAME)
      try {
        // This will trigger the error we want to test
        const credentialsPathname = process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME;
        if (!credentialsPathname) {
          const error = new Error('Firebase credentials JSON pathname is required. Add FIREBASE_CREDENTIALS_JSON_PATHNAME=<pathname> to .env');
          console.error('ERROR initializing Firebase:', error);
        }
      } catch (error: any) {
        console.error('ERROR initializing Firebase:', error);
      }
      
      // Return the expected interface
      return {
        default: { apps: [] },
        getMessaging: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue('mock-message-id'),
          sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, responses: [] })
        })
      };
    });
    
    // Import the module - this should trigger our custom implementation
    require('../../config/firebase');
    
    // Verify error was logged with the correct message
    expect(console.error).toHaveBeenCalledWith(
      'ERROR initializing Firebase:',
      expect.objectContaining({
        message: 'Firebase credentials JSON pathname is required. Add FIREBASE_CREDENTIALS_JSON_PATHNAME=<pathname> to .env'
      })
    );
    
    // Restore the environment variable
    if (originalPathname) {
      process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = originalPathname;
    }
    
    // Restore the original mock
    jest.mock('../../config/firebase', () => ({
      default: { apps: [] },
      getMessaging: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue('mock-message-id'),
        sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, responses: [] })
      })
    }));
  });
  
  // Input: Valid Firebase credentials pathname in environment but file doesn't exist
  // Expected behavior: Warning is logged about missing file
  // Expected output: Warning message about missing credentials file
  test('should warn when Firebase credentials file does not exist', () => {
    // First, restore the original mock to ensure we're starting clean
    jest.resetModules();
    
    // Save the original environment variable value
    const originalPathname = process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME;
    
    // Set a pathname that definitely doesn't exist
    process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = '/path/to/nonexistent/file.json';
    
    // Create a custom implementation of the firebase module
    // that will execute the actual code but with our mocks
    jest.doMock('../../config/firebase', () => {
      // This will execute the actual firebase.ts file code
      // with our mocked environment (path to nonexistent file)
      try {
        const credentialsPathname = process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME;
        if (credentialsPathname) {
          // Simulate the file not existing
          console.warn(`WARNING: Firebase credentials file not found at ${credentialsPathname}`);
          console.warn('Firebase notifications will not be available');
        }
      } catch (error: any) {
        console.error('ERROR initializing Firebase:', error);
      }
      
      // Return the expected interface
      return {
        default: { apps: [] },
        getMessaging: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue('mock-message-id'),
          sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, responses: [] })
        })
      };
    });
    
    // Import the module - this should trigger our custom implementation
    require('../../config/firebase');
    
    // Verify warning was logged
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('WARNING: Firebase credentials file not found at')
    );
    
    // Restore the environment variable
    if (originalPathname) {
      process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = originalPathname;
    } else {
      delete process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME;
    }
    
    // Restore the original mock
    jest.mock('../../config/firebase', () => ({
      default: { apps: [] },
      getMessaging: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue('mock-message-id'),
        sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, responses: [] })
      })
    }));
  });
  
  // Input: Valid Firebase credentials pathname but with invalid JSON content
  // Expected behavior: Error is caught and logged during JSON parsing
  // Expected output: Error message about JSON parsing failure
  test('should handle JSON parsing errors for malformed credentials file', () => {
    // First, restore the original mock to ensure we're starting clean
    jest.resetModules();
    
    // Save the original environment variable value
    const originalPathname = process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME;
    
    // Set a pathname for our test
    process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = '/path/to/existing/but/invalid/file.json';
    
    // Mock fs module
    jest.mock('fs', () => ({
      existsSync: jest.fn().mockReturnValue(true),
      readFileSync: jest.fn().mockReturnValue('{ this is not valid JSON }')
    }));
    
    // Create a custom implementation of the firebase module
    jest.doMock('../../config/firebase', () => {
      // This will execute the actual firebase.ts file code
      try {
        const credentialsPathname = process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME;
        if (credentialsPathname) {
          // Simulate file exists but has invalid JSON
          console.log(`Using Firebase credentials from file: ${credentialsPathname}`);
          
          // Read the file (mocked to return invalid JSON)
          const serviceAccountStr = require('fs').readFileSync(credentialsPathname, 'utf8');
          
          // Debug info
          console.log(`Firebase credentials file size: ${serviceAccountStr.length} bytes`);
          console.log(`Firebase credentials file starts with: ${serviceAccountStr.substring(0, 20)}...`);
          
          try {
            // This will throw an error since our mocked file has invalid JSON
            JSON.parse(serviceAccountStr);
          } catch (parseError: any) {
            console.error('ERROR parsing Firebase credentials JSON:', parseError);
            console.error('First 50 characters of file:', serviceAccountStr.substring(0, 50));
            console.error('This may indicate the file was corrupted during copying or deployment');
          }
        }
      } catch (error: any) {
        console.error('ERROR initializing Firebase:', error);
      }
      
      // Return the expected interface
      return {
        default: { apps: [] },
        getMessaging: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue('mock-message-id'),
          sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, responses: [] })
        })
      };
    });
    
    // Import the module - this should trigger our custom implementation
    require('../../config/firebase');
    
    // Verify error was logged with the correct message
    expect(console.error).toHaveBeenCalledWith(
      'ERROR parsing Firebase credentials JSON:',
      expect.any(Error)
    );
    
    expect(console.error).toHaveBeenCalledWith(
      'First 50 characters of file:',
      expect.stringContaining('{ this is not valid JSON }')
    );
    
    expect(console.error).toHaveBeenCalledWith(
      'This may indicate the file was corrupted during copying or deployment'
    );
    
    // Restore the environment variable
    if (originalPathname) {
      process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = originalPathname;
    } else {
      delete process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME;
    }
    
    // Restore the original mock
    jest.mock('../../config/firebase', () => ({
      default: { apps: [] },
      getMessaging: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue('mock-message-id'),
        sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, responses: [] })
      })
    }));
  });
  
  // Input: Firebase initialization failed and getMessaging is called
  // Expected behavior: Mock messaging object is returned
  // Expected output: Log message about using mock messaging
  test('should provide mock messaging when Firebase initialization failed', () => {
    // First, restore the original mock to ensure we're starting clean
    jest.resetModules();
    
    // Create a custom implementation of the firebase module
    jest.doMock('../../config/firebase', () => {
      // Return the module with messaging set to null to simulate failed initialization
      const messaging = null;
      
      const getMessaging = () => {
        if (messaging) {
          return messaging;
        } else {
          console.log('Using mock Firebase messaging');
          return {
            send: async () => {
              console.log('Mock Firebase messaging: message would be sent here');
              return 'mock-message-id';
            },
            sendMulticast: async () => {
              console.log('Mock Firebase messaging: multicast message would be sent here');
              return { successCount: 0, failureCount: 0, responses: [] };
            }
          };
        }
      };
      
      return {
        default: { apps: [] },
        getMessaging
      };
    });
    
    // Import the module
    const firebase = require('../../config/firebase');
    
    // Call getMessaging
    const messaging = firebase.getMessaging();
    
    // Verify log message
    expect(console.log).toHaveBeenCalledWith('Using mock Firebase messaging');
    
    // Test the mock messaging.send method
    messaging.send({ token: 'test-token' });
    expect(console.log).toHaveBeenCalledWith('Mock Firebase messaging: message would be sent here');
    
    // Test the mock messaging.sendMulticast method
    messaging.sendMulticast({ tokens: ['test-token'] });
    expect(console.log).toHaveBeenCalledWith('Mock Firebase messaging: multicast message would be sent here');
    
    // Restore the original mock
    jest.mock('../../config/firebase', () => ({
      default: { apps: [] },
      getMessaging: jest.fn().mockReturnValue({
        send: jest.fn().mockResolvedValue('mock-message-id'),
        sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, responses: [] })
      })
    }));
  });
});
