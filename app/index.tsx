import { Redirect } from 'expo-router';

import { useAuth } from '@/src/features/auth';

/**
 * Entry route: splash stays up until AuthProvider finishes SecureStore hydration,
 * then send the user to the main app or login.
 */
export default function Index() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (token) {
    return <Redirect href="/(main)" />;
  }

  return <Redirect href="/auth/login" />;
}
