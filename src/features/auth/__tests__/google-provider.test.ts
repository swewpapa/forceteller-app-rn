jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({ type: 'success', data: { idToken: 'g-token' } }),
    signOut: jest.fn().mockResolvedValue(null),
    configure: jest.fn(),
  },
}));
jest.mock('../providers/firebase', () => ({
  firebaseSignInWithGoogle: jest.fn().mockResolvedValue('fb-id-token'),
  firebaseSignOut: jest.fn().mockResolvedValue(undefined),
}));

import { googleProvider } from '../providers/google-provider';

describe('google-provider', () => {
  it('returns firebase id token from google sign-in', async () => {
    const result = await googleProvider.signIn();
    expect(result).toEqual({ firebaseIdToken: 'fb-id-token' });
  });
});
