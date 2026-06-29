import {
  getAuth,
  GoogleAuthProvider,
  signInWithCredential,
  signOut,
} from '@react-native-firebase/auth';

/** 구글 idToken으로 Firebase 로그인 후 Firebase ID token을 반환한다. */
export async function firebaseSignInWithGoogle(googleIdToken: string): Promise<string> {
  const auth = getAuth();
  const credential = GoogleAuthProvider.credential(googleIdToken);
  const userCred = await signInWithCredential(auth, credential);
  return userCred.user.getIdToken();
}

export async function firebaseSignOut(): Promise<void> {
  await signOut(getAuth());
}
