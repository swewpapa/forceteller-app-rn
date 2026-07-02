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
    console.log('[auth] Google signIn → idToken 있음:', !!googleIdToken); // [DEBUG] 제거 예정
    if (!googleIdToken) throw new Error('No Google ID token');
    // 25.x + google-signin 16.x: signInWithCredential이 accessToken을 요구해
    // getTokens로 accessToken을 받아 credential에 함께 전달한다.
    const { accessToken } = await GoogleSignin.getTokens();
    const { idToken, uid, name } = await firebaseSignInWithGoogle(googleIdToken, accessToken);
    console.log('[auth] Firebase idToken 받음:', !!idToken); // [DEBUG] 제거 예정
    return { firebaseIdToken: idToken, uid, name };
  },
  async signOut() {
    await GoogleSignin.signOut();
    await firebaseSignOut();
  },
};
