import { MaterialCommunityIcons } from '@expo/vector-icons';
import RenderHTML from 'react-native-render-html';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { authService } from '@/src/features/auth/auth.service';

type PolicyItem = {
  id: number;
  policy_name: string;
  description: string;
};

export default function CommissionPolicyScreen() {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [policies, setPolicies] = useState<PolicyItem[]>([]);
  const [activePolicyId, setActivePolicyId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadPolicies() {
        setLoading(true);
        setError('');
        try {
          const res = await authService.me();
          if (cancelled) return;
          if (!res.success) {
            setError(res.message || 'Không tải được chính sách hoa hồng.');
            setPolicies([]);
            setActivePolicyId(null);
            return;
          }

          const rawPolicies = res.data?.agent?.agent_commission_policy ?? [];
          const normalized = rawPolicies
            .map((p) => ({
              id: p.id,
              policy_name: p.policy_name?.trim() || 'Chính sách',
              description: p.description?.trim() || '<p>Chưa có mô tả chính sách.</p>',
            }))
            .filter((p) => Number.isFinite(p.id));

          setPolicies(normalized);
          setActivePolicyId(normalized[0]?.id ?? null);
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : 'Không tải được chính sách hoa hồng.');
            setPolicies([]);
            setActivePolicyId(null);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }

      void loadPolicies();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const activePolicy = useMemo(
    () => policies.find((p) => p.id === activePolicyId) ?? null,
    [policies, activePolicyId],
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
          <Text className="text-2xl font-semibold tracking-tight text-slate-900">Chính sách hoa hồng</Text>
        </View>

        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="small" color="#22c55e" />
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-sm text-red-600">{error}</Text>
          </View>
        ) : policies.length === 0 ? (
          <View className="flex-1 items-center justify-center px-6">
            <MaterialCommunityIcons name="file-document-outline" size={56} color="#94a3b8" />
            <Text className="mt-3 text-center text-sm text-slate-500">Hiện chưa có chính sách hoa hồng.</Text>
          </View>
        ) : (
          <View className="flex-1">
            <View className="border-b border-slate-200 bg-white px-4 py-2">
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-2">
                  {policies.map((policy) => (
                    <Pressable
                      key={policy.id}
                      className={`rounded-xl px-4 py-2 ${
                        activePolicyId === policy.id ? 'border border-green-100 bg-green-50' : ''
                      }`}
                      onPress={() => setActivePolicyId(policy.id)}>
                      <Text
                        className={`text-base font-semibold ${
                          activePolicyId === policy.id ? 'text-green-500' : 'text-slate-400'
                        }`}>
                        {policy.policy_name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>

            <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 pb-10">
              {activePolicy ? (
                <View className="rounded-2xl border border-slate-200 bg-white p-4">
                  <RenderHTML
                    contentWidth={Math.max(width - 48, 0)}
                    source={{ html: activePolicy.description }}
                    baseStyle={{ color: '#0f172a', fontSize: 16, lineHeight: 24 }}
                    tagsStyles={{
                      p: { marginTop: 0, marginBottom: 12 },
                      h1: { fontSize: 24, fontWeight: '700', marginBottom: 12 },
                      h2: { fontSize: 20, fontWeight: '700', marginBottom: 10 },
                      h3: { fontSize: 18, fontWeight: '700', marginBottom: 8 },
                      li: { marginBottom: 6 },
                    }}
                  />
                </View>
              ) : null}
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
