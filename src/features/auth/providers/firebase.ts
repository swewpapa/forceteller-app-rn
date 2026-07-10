import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from '@react-native-firebase/auth';

/** 구글 idToken(+accessToken)으로 Firebase 로그인 후 ID token·사용자 정보를 반환한다. */
export async function firebaseSignInWithGoogle(
  googleIdToken: string,
  accessToken?: string | null,
): Promise<{ idToken: string; uid: string; name: string | null }> {
  const auth = getAuth();
  const credential = GoogleAuthProvider.credential(googleIdToken, accessToken);
  const userCred = await signInWithCredential(auth, credential);
  const idToken = await userCred.user.getIdToken();
  return { idToken, uid: userCred.user.uid, name: userCred.user.displayName };
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(getAuth());
}
