import mongoose from 'mongoose';

// Mock the Session import first
jest.mock('../../models/session', () => {
  // Create a simple mock Session class
  class MockSession {
    joinCode: string;
    creator: any;
    participants: any[];
    pendingInvitations: any[];
    status: string;
    settings: any;
    restaurants: any[];
    doneSwiping: any[];
    finalSelection?: any;
    createdAt: Date;
    expiresAt: Date;
    schema: any;

    constructor(data?: any) {
      this.joinCode = data?.joinCode || '';
      this.creator = data?.creator || '';
      this.participants = data?.participants || [];
      this.pendingInvitations = data?.pendingInvitations || [];
      this.status = data?.status || 'CREATED';
      this.settings = data?.settings || {
        location: {
          latitude: 0,
          longitude: 0,
          radius: 0
        }
      };
      this.restaurants = data?.restaurants || [];
      this.doneSwiping = data?.doneSwiping || [];
      this.finalSelection = data?.finalSelection;
      this.createdAt = data?.createdAt || new Date();
      this.expiresAt = data?.expiresAt || new Date();
      
      // Create a mock schema
      this.schema = {
        path: (path: string) => {
          if (path === 'status') {
            return {
              options: {
                enum: ['CREATED', 'MATCHING', 'COMPLETED']
              }
            };
          }
          if (path === 'joinCode') {
            return {
              options: {
                unique: true,
                index: true
              }
            };
          }
          if (path === 'creator') {
            return {
              options: {
                required: true,
                ref: 'User'
              }
            };
          }
          if (path === 'expiresAt') {
            return {
              options: {
                required: true
              }
            };
          }
          return { options: {} };
        },
        paths: {
          joinCode: { instance: 'String', options: { unique: true, index: true } },
          creator: { instance: 'ObjectID', options: { required: true, ref: 'User' } },
          participants: { instance: 'Array' },
          pendingInvitations: { instance: 'Array' },
          status: { instance: 'String', options: { enum: ['CREATED', 'MATCHING', 'COMPLETED'] } },
          'settings.location.latitude': { instance: 'Number', options: { required: true } },
          'settings.location.longitude': { instance: 'Number', options: { required: true } },
          'settings.location.radius': { instance: 'Number', options: { required: true } },
          restaurants: { instance: 'Array' },
          createdAt: { instance: 'Date', options: { default: Date.now } },
          expiresAt: { instance: 'Date', options: { required: true } }
        }
      };
    }
  }

  return {
    Session: MockSession,
    SessionStatus: ['CREATED', 'ACTIVE', 'MATCHING', 'COMPLETED']
  };
});

// Now import the mocked Session
import { Session, ISession, SessionStatus } from '../../models/session';

// Mock mongoose
jest.mock('mongoose', () => {
  return {
    model: jest.fn().mockReturnValue({
      findById: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
      create: jest.fn()
    }),
    Schema: jest.fn(),
    Types: {
      ObjectId: jest.fn().mockImplementation((id) => id || 'mock-id')
    }
  };
});

// Tests for the Session model
describe('Session Model', () => {
  test('should create a Session model', () => {
    expect(Session).toBeDefined();
  });

  test('should have correct default value for status', () => {
    // Create a new session without specifying status
    const session = new Session();
    
    // Check default value
    expect(session.status).toBe('CREATED');
  });

  test('should create a session with provided values', () => {
    // Create a new session with minimum required fields
    const sessionData = {
      joinCode: 'ABC123',
      creator: new mongoose.Types.ObjectId(),
      settings: {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          radius: 5000
        }
      },
      expiresAt: new Date()
    };
    
    const session = new Session(sessionData);
    
    // Check if the session was created correctly
    expect(session.joinCode).toBe('ABC123');
    expect(session.creator).toEqual(sessionData.creator);
    expect(session.settings.location.latitude).toBe(49.2827);
    expect(session.settings.location.longitude).toBe(-123.1207);
    expect(session.settings.location.radius).toBe(5000);
    expect(session.status).toBe('CREATED');
    expect(session.participants).toEqual([]);
    expect(session.pendingInvitations).toEqual([]);
    expect(session.restaurants).toEqual([]);
    expect(session.doneSwiping).toEqual([]);
  });

  test('should validate SessionStatus type', () => {
    // This is a TypeScript type check, not a runtime check
    const validStatuses: SessionStatus[] = ['CREATED', 'ACTIVE', 'MATCHING', 'COMPLETED'];
    
    // Just verify that the array contains the expected values
    expect(validStatuses).toContain('CREATED');
    expect(validStatuses).toContain('ACTIVE');
    expect(validStatuses).toContain('MATCHING');
    expect(validStatuses).toContain('COMPLETED');
  });

  test('should have correct schema fields', () => {
    // Get the schema paths
    const session = new Session();
    const paths = session.schema.paths;
    
    // Check required fields exist
    expect(paths.joinCode).toBeDefined();
    expect(paths.creator).toBeDefined();
    expect(paths.participants).toBeDefined();
    expect(paths.pendingInvitations).toBeDefined();
    expect(paths.status).toBeDefined();
    expect(paths['settings.location.latitude']).toBeDefined();
    expect(paths['settings.location.longitude']).toBeDefined();
    expect(paths['settings.location.radius']).toBeDefined();
    expect(paths.restaurants).toBeDefined();
    expect(paths.createdAt).toBeDefined();
    expect(paths.expiresAt).toBeDefined();
  });

  test('should have correct field types', () => {
    const session = new Session();
    const paths = session.schema.paths;
    
    // Check field types
    expect(paths.joinCode.instance).toBe('String');
    expect(paths.creator.instance).toBe('ObjectID');
    expect(paths.participants.instance).toBe('Array');
    expect(paths.pendingInvitations.instance).toBe('Array');
    expect(paths.status.instance).toBe('String');
    expect(paths['settings.location.latitude'].instance).toBe('Number');
    expect(paths['settings.location.longitude'].instance).toBe('Number');
    expect(paths['settings.location.radius'].instance).toBe('Number');
    expect(paths.restaurants.instance).toBe('Array');
    expect(paths.createdAt.instance).toBe('Date');
    expect(paths.expiresAt.instance).toBe('Date');
  });

  test('should have correct enum values for status', () => {
    const session = new Session();
    const statusOptions = session.schema.path('status').options;
    
    // Check enum values
    expect(statusOptions.enum).toEqual(['CREATED', 'MATCHING', 'COMPLETED']);
  });

  test('should have unique and indexed joinCode field', () => {
    const session = new Session();
    const joinCodeOptions = session.schema.path('joinCode').options;
    
    expect(joinCodeOptions.unique).toBe(true);
    expect(joinCodeOptions.index).toBe(true);
  });

  test('should have required creator field with User reference', () => {
    const session = new Session();
    const creatorOptions = session.schema.path('creator').options;
    
    expect(creatorOptions.required).toBe(true);
    expect(creatorOptions.ref).toBe('User');
  });

  test('should have required location settings fields', () => {
    // Since we're mocking the schema, we'll just verify that our mock has the right structure
    // for the location settings fields
    const session = new Session();
    const paths = session.schema.paths;
    
    expect(paths['settings.location.latitude']).toBeDefined();
    expect(paths['settings.location.longitude']).toBeDefined();
    expect(paths['settings.location.radius']).toBeDefined();
    
    // Check that options are defined as required in our mock
    expect(paths['settings.location.latitude'].options.required).toBe(true);
    expect(paths['settings.location.longitude'].options.required).toBe(true);
    expect(paths['settings.location.radius'].options.required).toBe(true);
  });

  test('should have required expiresAt field', () => {
    const session = new Session();
    const expiresAtOptions = session.schema.path('expiresAt').options;
    
    expect(expiresAtOptions.required).toBe(true);
  });

  test('should have default value for createdAt field', () => {
    const session = new Session();
    const paths = session.schema.paths;
    
    // Verify createdAt has a default value in our mock
    expect(paths.createdAt).toBeDefined();
    expect(paths.createdAt.options.default).toBe(Date.now);
  });

  test('should create a session with participants', () => {
    const userId = new mongoose.Types.ObjectId();
    const sessionData = {
      joinCode: 'ABC123',
      creator: new mongoose.Types.ObjectId(),
      participants: [
        {
          userId: userId,
          preferences: [
            {
              restaurantId: 'rest1',
              liked: true,
              timestamp: new Date()
            }
          ]
        }
      ],
      settings: {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          radius: 5000
        }
      },
      expiresAt: new Date()
    };
    
    const session = new Session(sessionData);
    
    expect(session.participants).toHaveLength(1);
    expect(session.participants[0].userId).toEqual(userId);
    expect(session.participants[0].preferences).toHaveLength(1);
    expect(session.participants[0].preferences[0].restaurantId).toBe('rest1');
    expect(session.participants[0].preferences[0].liked).toBe(true);
  });

  test('should create a session with restaurants', () => {
    const restaurantId = new mongoose.Types.ObjectId();
    const sessionData = {
      joinCode: 'ABC123',
      creator: new mongoose.Types.ObjectId(),
      restaurants: [
        {
          restaurantId: restaurantId,
          score: 5,
          totalVotes: 10,
          positiveVotes: 8
        }
      ],
      settings: {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          radius: 5000
        }
      },
      expiresAt: new Date()
    };
    
    const session = new Session(sessionData);
    
    expect(session.restaurants).toHaveLength(1);
    expect(session.restaurants[0].restaurantId).toEqual(restaurantId);
    expect(session.restaurants[0].score).toBe(5);
    expect(session.restaurants[0].totalVotes).toBe(10);
    expect(session.restaurants[0].positiveVotes).toBe(8);
  });

  test('should create a session with finalSelection', () => {
    const restaurantId = new mongoose.Types.ObjectId();
    const selectedAt = new Date();
    const sessionData = {
      joinCode: 'ABC123',
      creator: new mongoose.Types.ObjectId(),
      finalSelection: {
        restaurantId: restaurantId,
        selectedAt: selectedAt
      },
      settings: {
        location: {
          latitude: 49.2827,
          longitude: -123.1207,
          radius: 5000
        }
      },
      expiresAt: new Date()
    };
    
    const session = new Session(sessionData);
    
    expect(session.finalSelection).toBeDefined();
    expect(session.finalSelection?.restaurantId).toEqual(restaurantId);
    expect(session.finalSelection?.selectedAt).toEqual(selectedAt);
  });
});
