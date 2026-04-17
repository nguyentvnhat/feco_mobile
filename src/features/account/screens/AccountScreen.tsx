import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/features/auth/auth.service';

import { AccountScreenHeader } from '../components/AccountScreenHeader';

export function AccountScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogout() {
    setError('');
    setLoading(true);
    try {
      const result = await authService.logout();
      if (!result.success) {
        setError(result.message);
        return;
      }
      router.replace('/auth/login');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
      <AccountScreenHeader />
      <View className="flex-1 px-4 py-6">
        <Pressable
          className={`items-center justify-center rounded-xl py-4 ${loading ? 'bg-slate-400' : 'bg-slate-900 active:bg-slate-800'}`}
          disabled={loading}
          onPress={handleLogout}>
          {loading ? (
            <ActivityIndicator color="#f8fafc" />
          ) : (
            <Text className="text-base font-semibold text-white">Đăng xuất</Text>
          )}
        </Pressable>
        {error ? <Text className="mt-4 text-center text-sm text-red-600">{error}</Text> : null}
      </View>
    </SafeAreaView>
  );
}
