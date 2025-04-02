import { OAuth2Client } from 'google-auth-library';

// Cache the token to avoid authenticating for each test
let cachedToken: string | null = null;
let tokenExpiryTime: number | null = null;

/**
 * Helper function to get a Google authentication token for unmocked tests
 * This is a placeholder function since authentication is now bypassed in test mode
 * 
 * @returns Promise<string> - A dummy Google ID token
 */
export async function getGoogleAuthToken(): Promise<string> {
  // Since authentication is bypassed in unmocked tests, we just return a dummy token
  // This token is never actually used for authentication
  return 'dummy-token-for-tests';
}

/**
 * Helper function to attach a Google authentication token to a supertest request
 * This is a placeholder function since authentication is now bypassed in test mode
 * 
 * @param request - The supertest request object
 * @returns The request with a dummy authentication header attached
 */
export async function attachGoogleAuthToken(request: any): Promise<any> {
  // Since authentication is bypassed in unmocked tests, we just attach a dummy token
  // This token is never actually used for authentication
  return request.set('Authorization', 'Bearer dummy-token-for-tests');
}
