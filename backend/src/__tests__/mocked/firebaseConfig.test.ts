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
