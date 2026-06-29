import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { env } from '@/shared/config';
import type { AuthProvider } from './auth-provider';
import { firebaseSignInWithGoogle, firebaseSignOut } from './firebase';

GoogleSignin.configure({ webClientId: env.googleWebClientId });

export const googleProvider: AuthProvider = {
  async signIn() {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    // 16.x: signIn() returns SignInResponse = SignInSuccessResponse | CancelledResponse
    // SignInSuccessResponse.data is User, User.idToken is string | null
    const googleIdToken = result.data?.idToken;
    if (!googleIdToken) throw new Error('No Google ID token');
    const firebaseIdToken = await firebaseSignInWithGoogle(googleIdToken);
    return { firebaseIdToken };
  },
  async signOut() {
    await GoogleSignin.signOut();
    await firebaseSignOut();
  },
};
