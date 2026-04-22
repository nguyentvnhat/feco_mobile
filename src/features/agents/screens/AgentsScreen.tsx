import { useFocusEffect } from '@react-navigation/native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { agentsService } from '@/src/features/agents';
import type { ChildAgent } from '@/src/features/agents';

type StatusTab = {
  key: 'all' | 'active' | 'inactive';
  label: string;
};

function normalizeStatus(status?: string | null) {
  return (status || '').trim().toLowerCase();
}

function isActiveStatus(status?: string | null) {
  const s = normalizeStatus(status);
  return s === 'active' || s === 'đang hoạt động' || s === 'hoat_dong' || s === 'hoạt động';
}

function isInactiveStatus(status?: string | null) {
  const s = normalizeStatus(status);
  return s === 'inactive' || s === 'ngừng hoạt động' || s === 'ngung_hoat_dong' || s === 'disabled';
}

function toVietnameseStatus(status?: string | null) {
  const s = normalizeStatus(status);
  if (isActiveStatus(status)) return 'Đang hoạt động';
  if (isInactiveStatus(status)) return 'Ngừng hoạt động';
  if (s === 'pending') return 'Chờ duyệt';
  return status || '--';
}

export function AgentsScreen() {
  const [activeTab, setActiveTab] = useState<StatusTab['key']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agents, setAgents] = useState<ChildAgent[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadAgents() {
        setLoading(true);
        setError('');
        try {
          const res = await agentsService.listChildren();
          if (cancelled) return;
          if (!res.success) {
            setError(res.message || 'Không tải được danh sách đại lý.');
            setAgents([]);
            return;
          }
          setAgents(res.data?.agents ?? []);
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : 'Không tải được danh sách đại lý.');
            setAgents([]);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }

      void loadAgents();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const activeCount = useMemo(() => agents.filter((a) => isActiveStatus(a.status)).length, [agents]);
  const inactiveCount = useMemo(() => agents.filter((a) => isInactiveStatus(a.status)).length, [agents]);

  const tabs: StatusTab[] = useMemo(
    () => [
      { key: 'all', label: `Tất cả (${agents.length})` },
      { key: 'active', label: `Đang hoạt động (${activeCount})` },
      { key: 'inactive', label: `Ngừng hoạt động (${inactiveCount})` },
    ],
    [agents.length, activeCount, inactiveCount],
  );

  const filteredAgents = useMemo(() => {
    if (activeTab === 'all') return agents;
    if (activeTab === 'active') return agents.filter((a) => isActiveStatus(a.status));
    return agents.filter((a) => isInactiveStatus(a.status));
  }, [agents, activeTab]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-4 py-3">
          <Text className="text-2xl font-semibold tracking-tight text-slate-900">Quản lý Đại lý</Text>
        </View>

        <View className="border-b border-slate-200 bg-white px-4 py-3">
          <View className="flex-row items-center rounded-xl bg-slate-100 px-3 py-3">
            <Feather name="search" size={20} color="#94a3b8" />
            <Text className="ml-2 text-base text-slate-400">Tìm kiếm theo tên hoặc khu vực...</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
            <View className="flex-row gap-2">
              {tabs.map((tab) => (
                <Pressable
                  key={tab.key}
                  className={`rounded-xl px-4 py-2 ${
                    activeTab === tab.key ? 'border border-green-100 bg-green-50' : ''
                  }`}
                  onPress={() => setActiveTab(tab.key)}>
                  <Text
                    className={`text-base font-semibold ${
                      activeTab === tab.key ? 'text-green-500' : 'text-slate-400'
                    }`}>
                    {tab.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 pb-8">
          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="small" color="#22c55e" />
            </View>
          ) : error ? (
            <Text className="text-center text-sm text-red-600">{error}</Text>
          ) : filteredAgents.length === 0 ? (
            <View className="items-center py-12">
              <MaterialCommunityIcons name="account-group-outline" size={56} color="#94a3b8" />
              <Text className="mt-3 text-center text-sm font-medium text-slate-500">
                Hiện không có đại lý nào
              </Text>
            </View>
          ) : (
            filteredAgents.map((agent) => (
              <View key={agent.id} className="mb-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
                <View className="flex-row items-start justify-between">
                  <Text className="flex-1 text-base font-semibold text-slate-900">{agent.name || 'Đại lý'}</Text>
                  <View
                    className="rounded-full px-3 py-1"
                    style={{ backgroundColor: isActiveStatus(agent.status) ? '#ECFDF5' : '#F1F5F9' }}>
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: isActiveStatus(agent.status) ? '#22C55E' : '#64748B' }}>
                      {toVietnameseStatus(agent.status)}
                    </Text>
                  </View>
                </View>

                <View className="mt-2 flex-row items-center">
                  <Ionicons name="location-sharp" size={14} color="#64748b" />
                  <Text className="ml-1 text-base text-slate-500">{[agent.ward, agent.city].filter(Boolean).join(', ') || '--'}</Text>
                </View>

                <Text className="mt-2 text-base font-semibold text-slate-400">MÃ ĐẠI LÝ: {agent.code || '--'}</Text>
              </View>
            ))
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
