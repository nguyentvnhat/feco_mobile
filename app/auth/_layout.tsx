import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/src/features/auth';

export default function AuthLayout() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }
  if (token) {
    return <Redirect href="/(main)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
