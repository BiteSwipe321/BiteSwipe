import * as admin from 'firebase-admin';
import * as fs from 'fs';

// Mock dependencies
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn()
}));

jest.mock('firebase-admin', () => ({
  apps: [],
  initializeApp: jest.fn(),
  messaging: jest.fn(),
  credential: {
    cert: jest.fn()
  }
}));

describe('Firebase Configuration', () => {
  // Store original console methods
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  const originalEnv = process.env;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock console methods
    console.log = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
    
    // Reset environment
    process.env = { ...originalEnv };
    
    // Reset module cache
    jest.resetModules();
  });
  
  afterEach(() => {
    // Restore console methods
    console.log = originalConsoleLog;
    console.warn = originalConsoleWarn;
    console.error = originalConsoleError;
    
    // Restore environment
    process.env = originalEnv;
  });
  
  test('should throw error when credentials path is not provided', () => {
    // Remove the environment variable
    delete process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME;
    
    // Import the module to trigger initialization
    require('../../config/firebase');
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'ERROR initializing Firebase:',
      expect.objectContaining({
        message: expect.stringContaining('Firebase credentials JSON pathname is required')
      })
    );
    expect(console.warn).toHaveBeenCalledWith('Firebase notifications will not be available');
  });
  
  test('should warn when credentials file does not exist', () => {
    // Set the environment variable
    process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = '/path/to/nonexistent/file.json';
    
    // Mock fs.existsSync to return false
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    
    // Import the module to trigger initialization
    jest.resetModules();
    require('../../config/firebase');
    
    // Verify warning was logged
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('WARNING: Firebase credentials file not found')
    );
    expect(console.warn).toHaveBeenCalledWith('Firebase notifications will not be available');
  });
  
  test('should handle JSON parse error in credentials file', () => {
    // Set the environment variable
    process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = '/path/to/invalid/file.json';
    
    // Mock fs.existsSync to return true and readFileSync to return invalid JSON
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('{ invalid json }');
    
    // Import the module to trigger initialization
    jest.resetModules();
    require('../../config/firebase');
    
    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      'ERROR parsing Firebase credentials JSON:',
      expect.any(Error)
    );
    expect(console.error).toHaveBeenCalledWith(
      'First 50 characters of file:',
      expect.stringContaining('{ invalid json }')
    );
  });
  
  test('should initialize Firebase successfully with valid credentials', () => {
    // Set the environment variable
    process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME = '/path/to/valid/file.json';
    
    // Mock fs functions
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    const validServiceAccount = { type: 'service_account', project_id: 'test-project' };
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(validServiceAccount));
    
    // Mock admin.apps to be empty to trigger initialization
    (admin.apps as any) = [];
    
    // Import the module to trigger initialization
    jest.resetModules();
    const firebase = require('../../config/firebase');
    
    // Verify Firebase was initialized
    expect(admin.initializeApp).toHaveBeenCalled();
    expect(admin.credential.cert).toHaveBeenCalledWith(validServiceAccount);
    expect(admin.messaging).toHaveBeenCalled();
    
    // Verify exports
    expect(firebase.default).toBe(admin);
    expect(typeof firebase.getMessaging).toBe('function');
  });
  
  test('getMessaging should return mock messaging when initialization fails', () => {
    // Remove the environment variable to force initialization failure
    delete process.env.FIREBASE_CREDENTIALS_JSON_PATHNAME;
    
    // Import the module
    jest.resetModules();
    const firebase = require('../../config/firebase');
    
    // Get the messaging instance
    const messaging = firebase.getMessaging();
    
    // Verify it's a mock messaging instance
    expect(messaging).not.toBeNull();
    expect(typeof messaging.send).toBe('function');
    
    // Call the mock send function
    messaging.send({ token: 'test-token' });
    
    // Verify log was called
    expect(console.log).toHaveBeenCalledWith('Mock Firebase messaging: message would be sent here');
  });
});
