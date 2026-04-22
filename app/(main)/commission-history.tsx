import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ordersService } from '@/src/features/orders';
import type { CommissionHistoryOrder, CommissionItem } from '@/src/features/orders';

type RewardRow = {
  id: string;
  title: string;
  date: string;
  amount: string;
  status: string;
  state: 'success' | 'pending' | 'cancelled';
};

function formatOrderDate(iso: string | null) {
  if (!iso) return '--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--';
  const datePart = d.toLocaleDateString('vi-VN');
  const timePart = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} ${timePart}`;
}

function normalizeState(status: string): RewardRow['state'] {
  if (status === 'pending') return 'pending';
  if (status === 'rejected') return 'cancelled';
  return 'success';
}

function stateStyle(state: 'success' | 'pending' | 'cancelled') {
  if (state === 'pending') {
    return {
      icon: 'clock-outline' as const,
      iconColor: '#F59E0B',
      iconBg: '#FFF7ED',
      amountColor: '#D97706',
      statusColor: '#D97706',
    };
  }
  if (state === 'cancelled') {
    return {
      icon: 'close-circle-outline' as const,
      iconColor: '#EF4444',
      iconBg: '#FEF2F2',
      amountColor: '#EF4444',
      statusColor: '#EF4444',
    };
  }
  return {
    icon: 'cash-multiple' as const,
    iconColor: '#22C55E',
    iconBg: '#ECFDF5',
    amountColor: '#22C55E',
    statusColor: '#94A3B8',
  };
}

export default function CommissionHistoryScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rows, setRows] = useState<RewardRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadHistory() {
        setLoading(true);
        setError('');
        try {
          const res = await ordersService.historyCommission();
          if (cancelled) return;
          if (!res.success) {
            setError(res.message || 'Không tải được lịch sử hoa hồng.');
            setRows([]);
            return;
          }

          const mapped = (res.data?.orders ?? []).flatMap((order: CommissionHistoryOrder) => {
            const code = order.order_no.startsWith('#') ? order.order_no : `#${order.order_no}`;
            return (order.commissions ?? []).map((commission: CommissionItem) => ({
              id: `${order.id}-${commission.id}`,
              title: `Đơn hàng ${code}`,
              date: formatOrderDate(order.order_date),
              amount: `+${commission.amount} đ`,
              status: commission.settlement_status_label_vi || commission.settlement_status,
              state: normalizeState(commission.settlement_status),
            }));
          });

          setRows(mapped);
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : 'Không tải được lịch sử hoa hồng.');
            setRows([]);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      }

      void loadHistory();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const rewards = useMemo(() => rows, [rows]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-3">
          <Pressable
            className="mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
            onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#0f172a" />
          </Pressable>
          <Text className="text-2xl font-semibold tracking-tight text-slate-900">Hoa hồng của tôi</Text>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6 pt-4">
          <Text className="mb-3 text-base font-semibold text-slate-900">Lịch sử nhận thưởng</Text>

          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="small" color="#22c55e" />
            </View>
          ) : error ? (
            <Text className="text-center text-sm text-red-600">{error}</Text>
          ) : rewards.length === 0 ? (
            <Text className="text-center text-sm text-slate-500">Hiện chưa có lịch sử hoa hồng.</Text>
          ) : (
            rewards.map((item) => {
              const style = stateStyle(item.state);
              return (
                <View key={item.id} className="mb-3 rounded-xl bg-white px-3 py-3 shadow-sm shadow-slate-900/5">
                  <View className="flex-row items-center">
                    <View
                      className="h-12 w-12 items-center justify-center rounded-full"
                      style={{ backgroundColor: style.iconBg }}>
                      <MaterialCommunityIcons name={style.icon} size={22} color={style.iconColor} />
                    </View>

                    <View className="ml-3 flex-1">
                      <Text className="text-base font-semibold text-slate-800">{item.title}</Text>
                      <Text className="mt-0.5 text-sm text-slate-400">{item.date}</Text>
                    </View>

                    <View className="items-end">
                      <Text className="text-base font-semibold" style={{ color: style.amountColor }}>
                        {item.amount}
                      </Text>
                      <Text className="mt-0.5 text-sm font-medium" style={{ color: style.statusColor }}>
                        {item.status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
