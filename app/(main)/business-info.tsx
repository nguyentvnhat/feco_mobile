import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/lib/api';

type SettingsResponse = {
  success: boolean;
  message: string;
  data?: {
    settings?: Array<{
      key: string;
      value: string | null;
    }>;
  };
};

export default function BusinessInfoScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [businessInfo, setBusinessInfo] = useState('');

  const loadBusinessInfo = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<SettingsResponse>('/settings', { key: 'business_info' });
      if (!res.success) {
        setError(res.message || 'Không tải được thông tin doanh nghiệp.');
        setBusinessInfo('');
        return;
      }
      const value = res.data?.settings?.[0]?.value?.trim() || '';
      setBusinessInfo(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được thông tin doanh nghiệp.');
      setBusinessInfo('');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadBusinessInfo();
      return undefined;
    }, [loadBusinessInfo]),
  );

  const businessInfoLines = useMemo(
    () =>
      businessInfo
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    [businessInfo],
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-3">
          <Pressable
            className="mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
            onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#0f172a" />
          </Pressable>
          <Text className="text-2xl font-semibold tracking-tight text-slate-900">Thông tin doanh nghiệp</Text>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-6 py-8">
          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="small" color="#22c55e" />
            </View>
          ) : error ? (
            <View className="items-center py-8">
              <Text className="text-center text-sm text-red-600">{error}</Text>
              <Pressable
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2.5 active:bg-slate-800"
                onPress={() => void loadBusinessInfo()}>
                <Text className="text-sm font-semibold text-white">Tải lại</Text>
              </Pressable>
            </View>
          ) : businessInfoLines.length === 0 ? (
            <View className="items-center py-10">
              <Text className="text-center text-sm text-slate-500">Chưa có thông tin doanh nghiệp.</Text>
            </View>
          ) : (
            <View className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
              {businessInfoLines.map((line, idx) => (
                <Text key={`${line}-${idx}`} className="mb-2 text-base text-slate-900">
                  {line}
                </Text>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
