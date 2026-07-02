jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({ type: 'success', data: { idToken: 'g-token' } }),
    getTokens: jest.fn().mockResolvedValue({ idToken: 'g-token', accessToken: 'g-access' }),
    signOut: jest.fn().mockResolvedValue(null),
    configure: jest.fn(),
  },
}));
jest.mock('../providers/firebase', () => ({
  firebaseSignInWithGoogle: jest
    .fn()
    .mockResolvedValue({ idToken: 'fb-id-token', uid: 'uid-1', name: 'Tester' }),
  firebaseSignOut: jest.fn().mockResolvedValue(undefined),
}));

import { googleProvider } from '../providers/google-provider';

describe('google-provider', () => {
  it('returns firebase id token + user info from google sign-in', async () => {
    const result = await googleProvider.signIn();
    expect(result).toEqual({ firebaseIdToken: 'fb-id-token', uid: 'uid-1', name: 'Tester' });
  });
});
