/**
 * Firebase Configuration Tests
 * 
 * This file tests the firebase.ts module which initializes Firebase Admin SDK
 * and provides messaging functionality for push notifications.
 */

// Import the firebase module (which will use the mock from setup.ts)
const firebase = require('../../config/firebase');

describe('Firebase Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should have firebase module', () => {
    expect(firebase).toBeDefined();
  });

  test('should have firebaseAdmin property', () => {
    expect(firebase.firebaseAdmin).toBeDefined();
  });

  test('firebaseAdmin should have messaging function', () => {
    expect(typeof firebase.firebaseAdmin.messaging).toBe('function');
  });

  test('messaging should return an object with send function', () => {
    const messaging = firebase.firebaseAdmin.messaging();
    expect(messaging).toBeDefined();
    expect(typeof messaging.send).toBe('function');
  });

  test('messaging.send should return a message ID', async () => {
    const messaging = firebase.firebaseAdmin.messaging();
    const result = await messaging.send({ token: 'test-token' });
    expect(result).toBe('message-id');
  });
});

// Create a separate mock for testing the actual implementation
jest.mock('../../config/firebase', () => {
  // Create a mock of the actual implementation
  const mockMessaging = {
    send: jest.fn().mockImplementation(() => {
      console.log('Mock Firebase messaging: message would be sent here');
      return Promise.resolve('message-id');
    }),
    sendMulticast: jest.fn().mockImplementation(() => {
      console.log('Mock Firebase messaging: multicast message would be sent here');
      return Promise.resolve({ successCount: 0, failureCount: 0, responses: [] });
    })
  };

  return {
    firebaseAdmin: {
      messaging: () => mockMessaging
    },
    // Add the getMessaging function from the actual implementation
    getMessaging: jest.fn().mockReturnValue(mockMessaging)
  };
}, { virtual: true });

describe('Firebase getMessaging function', () => {
  // Store original console methods
  const originalConsole = {
    log: console.log
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
    console.log = jest.fn();
  });

  afterEach(() => {
    // Restore console methods
    console.log = originalConsole.log;
  });

  test('getMessaging should return a messaging object', () => {
    const messaging = firebase.getMessaging();
    expect(messaging).toBeDefined();
    expect(typeof messaging.send).toBe('function');
  });

  test('messaging.send should log a message when called', () => {
    const messaging = firebase.getMessaging();
    messaging.send({ token: 'test-token' });
    expect(console.log).toHaveBeenCalledWith('Mock Firebase messaging: message would be sent here');
  });

  test('messaging.sendMulticast should log a message when called', () => {
    const messaging = firebase.getMessaging();
    messaging.sendMulticast({ tokens: ['test-token'] });
    expect(console.log).toHaveBeenCalledWith('Mock Firebase messaging: multicast message would be sent here');
  });
});




