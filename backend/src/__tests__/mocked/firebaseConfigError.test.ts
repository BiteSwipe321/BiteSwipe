/**
 * Test file for Firebase configuration error handling
 * 
 * This test focuses on error handling in the Firebase configuration:
 * 1. Missing Firebase credentials pathname
 * 2. Non-existent credentials file
 * 3. Invalid JSON in credentials file
 * 4. Mock messaging implementation when Firebase initialization fails
 */

// Temporarily disable the global mock for this test file
jest.unmock('../../config/firebase');

// Mock fs module to control file existence checks
const mockExistsSync = jest.fn().mockReturnValue(false);
const mockReadFileSync = jest.fn().mockReturnValue('{}');

jest.mock('fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
}));

// Mock firebase-admin to prevent actual initialization
const mockMessaging = {
  send: jest.fn().mockResolvedValue('mock-message-id'),
  sendMulticast: jest.fn().mockResolvedValue({ successCount: 1, failureCount: 0, responses: [] })
};

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  messaging: jest.fn().mockReturnValue(mockMessaging)
}));

// Save original environment and console methods
const originalEnv = process.env;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

describe('Firebase Configuration Error Handling', () => {
  // Setup before tests
  beforeEach(() => {
    jest.resetModules(); // Clear module cache
    process.env = { ...originalEnv }; // Make a copy of original env
    delete process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME; // Ensure the env var is not set
    
    // Reset mock implementations
    mockExistsSync.mockReturnValue(false);
    mockReadFileSync.mockReturnValue('{}');
    
    // Mock console methods to prevent test output pollution and capture calls
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
  });

  // Restore environment and console methods after tests
  afterEach(() => {
    process.env = originalEnv; // Restore original env
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
    jest.clearAllMocks();
  });
  
  // Input: Valid Firebase credentials pathname with valid JSON content
  // Expected behavior: Firebase is initialized successfully
  // Expected output: Log message about successful initialization
  test('should initialize Firebase successfully with valid credentials', () => {
    // Set a pathname for our test
    process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = '/path/to/valid/credentials.json';
    
    // Mock file to exist and contain valid JSON
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({
      type: 'service_account',
      project_id: 'test-project',
      private_key_id: 'test-key-id',
      private_key: 'test-private-key',
      client_email: 'test@example.com',
      client_id: 'test-client-id',
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: 'https://www.googleapis.com/robot/v1/metadata/x509/test%40example.com'
    }));
    
    // Reset module cache to ensure our new env var and mocks are used
    jest.resetModules();
    
    // Act
    require('../../config/firebase');
    
    // Assert - verify debug info and success message was logged
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Using Firebase credentials from file:')
    );
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Firebase credentials file size:')
    );
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Firebase credentials file starts with:')
    );
    
    expect(console.log).toHaveBeenCalledWith('Firebase initialized successfully');
  });

  // Input: No Firebase credentials pathname in environment
  // Expected behavior: Error is thrown during initialization
  // Expected output: Error message about missing credentials pathname
  test('should throw error when Firebase credentials pathname is missing', () => {
    // Act
    require('../../config/firebase');
    
    // Assert - verify that the error was logged
    expect(console.error).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      'ERROR initializing Firebase:',
      expect.objectContaining({
        message: 'Firebase credentials JSON pathname is required. Add FIREBASE_CREDENTIALS_JSON_PATHNAME=<pathname> to .env'
      })
    );
  });

  // Input: Valid Firebase credentials pathname in environment but file doesn't exist
  // Expected behavior: Warning is logged about missing file
  // Expected output: Warning message about missing credentials file
  test('should warn when Firebase credentials file does not exist', () => {
    // Set a pathname that we've mocked to not exist
    process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = '/path/to/nonexistent/file.json';
    
    // Reset module cache to ensure our new env var is used
    jest.resetModules();
    
    // Act
    require('../../config/firebase');
    
    // Assert
    expect(console.warn).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('WARNING: Firebase credentials file not found at')
    );
  });
  
  // Input: Valid Firebase credentials pathname with file that exists but contains invalid JSON
  // Expected behavior: Error is caught during JSON parsing and logged
  // Expected output: Error message about JSON parsing failure
  test('should handle JSON parsing errors for malformed credentials file', () => {
    // Set a pathname for our test
    process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = '/path/to/existing/but/invalid/file.json';
    
    // Mock file to exist but contain invalid JSON
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue('{ this is not valid JSON }');
    
    // Reset module cache to ensure our new env var and mocks are used
    jest.resetModules();
    
    // Act
    require('../../config/firebase');
    
    // Assert - verify debug info and error was logged
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Using Firebase credentials from file:')
    );
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Firebase credentials file size:')
    );
    
    expect(console.log).toHaveBeenCalledWith(
      expect.stringContaining('Firebase credentials file starts with:')
    );
    
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
  });
});

describe('Firebase Mock Messaging', () => {
  // Setup before tests
  beforeEach(() => {
    jest.resetModules(); // Clear module cache
    process.env = { ...originalEnv }; // Make a copy of original env
    
    // Mock console methods to prevent test output pollution and capture calls
    console.error = jest.fn();
    console.warn = jest.fn();
    console.log = jest.fn();
  });

  // Restore environment and console methods after tests
  afterEach(() => {
    process.env = originalEnv; // Restore original env
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.log = originalConsoleLog;
    jest.clearAllMocks();
  });
  
  // Input: Firebase initialization failed and getMessaging is called
  // Expected behavior: Mock messaging object is returned
  // Expected output: Log message about using mock messaging
  test('should provide mock messaging when Firebase initialization failed', () => {
    // Create a custom mock for firebase-admin that doesn't initialize messaging
    jest.resetModules();
    jest.mock('firebase-admin', () => ({
      apps: [],
      initializeApp: jest.fn(),
      credential: {
        cert: jest.fn()
      },
      // Return undefined for messaging to force the else branch
      messaging: jest.fn().mockReturnValue(undefined)
    }));
    
    // Set environment variables to ensure Firebase tries to initialize
    process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = '/path/to/valid/credentials.json';
    mockExistsSync.mockReturnValue(true);
    mockReadFileSync.mockReturnValue(JSON.stringify({
      type: 'service_account',
      project_id: 'test-project'
    }));
    
    // Import the module directly (not using doMock)
    const firebase = require('../../config/firebase');
    
    // Call getMessaging which should return the mock implementation
    const messaging = firebase.getMessaging();
    
    // Verify log message about using mock messaging
    expect(console.log).toHaveBeenCalledWith('Using mock Firebase messaging');
    
    // Test the mock messaging.send method
    return messaging.send({ token: 'test-token' })
      .then((result: string) => {
        // Verify the mock send method was called and returned expected result
        expect(console.log).toHaveBeenCalledWith('Mock Firebase messaging: message would be sent here');
        expect(result).toBe('mock-message-id');
        
        // Test the mock messaging.sendMulticast method
        return messaging.sendMulticast({ tokens: ['test-token'] });
      })
      .then((result: { successCount: number; failureCount: number; responses: any[] }) => {
        // Verify the mock sendMulticast method was called and returned expected result
        expect(console.log).toHaveBeenCalledWith('Mock Firebase messaging: multicast message would be sent here');
        expect(result).toEqual({ successCount: 0, failureCount: 0, responses: [] });
      });
  });
});
