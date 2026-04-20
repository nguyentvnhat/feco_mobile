import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/src/features/auth';

import { AccountScreenHeader } from '../components/AccountScreenHeader';

export function AccountScreen() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await logout();
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
      </View>
    </SafeAreaView>
  );
}
