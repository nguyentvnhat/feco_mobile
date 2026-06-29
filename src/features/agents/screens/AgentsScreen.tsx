import { useFocusEffect, router } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRefetchOnReconnect } from '@/hooks/use-network';
import { agentsService } from '../agents.service';
import type { ChildAgent } from '../agents.types';
import { toUserFacingMessage } from '@/src/lib/user-facing-error';

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

function withCurrencySuffix(value?: string | null, currency?: string | null) {
  const trimmed = (value ?? '').trim();
  if (!trimmed) return '--';
  if (/[đ₫]$/i.test(trimmed)) return trimmed;
  const normalizedCurrency = (currency ?? '').trim();
  return normalizedCurrency ? `${trimmed}${normalizedCurrency}` : `${trimmed}đ`;
}

function formatAgentAddress(agent: ChildAgent) {
  const full = (agent.full_address || '').trim();
  if (full) return full;

  const parts = [agent.address, agent.ward, agent.city].map((part) => (part || '').trim()).filter(Boolean);
  if (parts.length > 0) return parts.join(', ');

  return (agent.region || '').trim() || '--';
}

function formatCallablePhone(phone?: string | null) {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.length > 0 ? digits : null;
}

function AgentMetaRow({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <View className="flex-row items-center gap-2.5">
      <View className="w-[18px] items-center justify-center">{icon}</View>
      <View className="min-w-0 flex-1">{children}</View>
    </View>
  );
}

function getOrderDaysAgoLabel(latestOrderAt?: string | null) {
  const raw = (latestOrderAt || '').trim();
  if (!raw) return null;

  const latestAt = new Date(raw);
  const latestMs = latestAt.getTime();
  if (!Number.isFinite(latestMs)) return null;

  const diffHours = (Date.now() - latestMs) / (1000 * 60 * 60);
  if (diffHours <= 24) return null;

  const days = Math.max(1, Math.round(diffHours / 24));
  return `Đơn hàng cách đây ${days} ngày`;
}

export function AgentsScreen() {
  const [activeTab, setActiveTab] = useState<StatusTab['key']>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [agents, setAgents] = useState<ChildAgent[]>([]);

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await agentsService.listChildren();
      if (!res.success) {
        setError(toUserFacingMessage(res.message, 'Không tải được danh sách đại lý.'));
        setAgents([]);
        return;
      }
      setAgents(res.data?.agents ?? []);
    } catch (e) {
      setError(toUserFacingMessage(e, 'Không tải được danh sách đại lý.'));
      setAgents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setActiveTab('all');
      void loadAgents();
    }, [loadAgents]),
  );

  useRefetchOnReconnect(loadAgents);

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
          <Text className="text-lg font-semibold text-slate-900">Quản lý Đại lý</Text>
        </View>

        <View className="border-b border-slate-200 bg-white px-4 py-3">
          <View className="flex-row items-center rounded-xl bg-slate-100 px-3 py-3">
            <Feather name="search" size={20} color="#94a3b8" />
            <Text className="ml-2 text-sm text-slate-400">Tìm kiếm theo tên hoặc khu vực...</Text>
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
                    className={`text-sm font-semibold ${
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
              <View className="h-20 w-20 items-center justify-center rounded-full bg-green-50">
                <MaterialCommunityIcons name="account-group-outline" size={40} color="#22c55e" />
              </View>
              <Text className="mt-3 text-center text-sm font-medium text-slate-500">
                Hiện không có đại lý nào
              </Text>
            </View>
          ) : (
            filteredAgents.map((agent) => {
              const orderDaysAgoLabel = getOrderDaysAgoLabel(agent.latest_order_at);
              const callablePhone = formatCallablePhone(agent.phone);
              const displayPhone = (agent.phone || '').trim() || '--';
              const displayAddress = formatAgentAddress(agent);

              return (
              <View
                key={agent.id}
                className="mb-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
                <View className="flex-row items-start justify-between gap-3">
                  <Text className="min-w-0 flex-1 text-base font-semibold text-slate-900">{agent.name || 'Đại lý'}</Text>
                  <View
                    className="shrink-0 rounded-full px-3 py-1"
                    style={{ backgroundColor: isActiveStatus(agent.status) ? '#ECFDF5' : '#F1F5F9' }}>
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: isActiveStatus(agent.status) ? '#22C55E' : '#64748B' }}>
                      {toVietnameseStatus(agent.status)}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 gap-2">
                  {callablePhone ? (
                    <AgentMetaRow icon={<MaterialCommunityIcons name="phone-outline" size={16} color="#16a34a" />}>
                      <Pressable
                        className="self-start active:opacity-70"
                        onPress={() => void Linking.openURL(`tel:${callablePhone}`)}>
                        <Text className="text-sm font-medium text-green-600">{displayPhone}</Text>
                      </Pressable>
                    </AgentMetaRow>
                  ) : (
                    <AgentMetaRow icon={<MaterialCommunityIcons name="phone-outline" size={16} color="#94a3b8" />}>
                      <Text className="text-sm text-slate-400">{displayPhone}</Text>
                    </AgentMetaRow>
                  )}
                  <AgentMetaRow icon={<Ionicons name="location-sharp" size={16} color="#64748b" />}>
                    <Text className="text-sm leading-5 text-slate-500">{displayAddress}</Text>
                  </AgentMetaRow>
                </View>

                <Pressable
                  className="mt-3 border-t border-slate-100 pt-3 active:opacity-95"
                  onPress={() =>
                    router.push({
                      pathname: '/(main)/agent-orders',
                      params: {
                        agentId: String(agent.id),
                        agentName: agent.name || 'Đại lý',
                      },
                    })
                  }>
                  <AgentMetaRow icon={<MaterialCommunityIcons name="cash-multiple" size={16} color="#22C55E" />}>
                    <View className="flex-row flex-wrap items-center gap-x-1.5">
                      <Text className="text-xl font-bold leading-7 text-green-500">
                        {withCurrencySuffix(agent.total_revenue, agent.currency)}
                      </Text>
                      <Text className="text-xs font-medium leading-7 text-slate-400">(doanh số trước thuế)</Text>
                    </View>
                  </AgentMetaRow>

                  <Text className="mt-2 pl-[28px] text-sm text-slate-500">
                    Số đơn: <Text className="font-semibold text-slate-700">{agent.order_sold_count ?? 0}</Text>
                    {orderDaysAgoLabel ? (
                      <Text className="text-amber-600"> ({orderDaysAgoLabel})</Text>
                    ) : null}
                  </Text>

                  <View className="mt-3 flex-row items-center justify-end gap-1">
                    <Text className="text-sm font-semibold text-green-600">Xem đơn hàng</Text>
                    <MaterialCommunityIcons name="chevron-right" size={18} color="#16a34a" />
                  </View>
                </Pressable>
              </View>
            );
            })
          )}

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
