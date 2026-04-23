import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/features/auth/auth.service';
import { mapOrderToRecentRow, ordersService } from '@/src/features/orders';
import type { RecentOrderRow } from '@/src/features/orders';
import { Spacings } from '@/src/theme';

const shortcuts = [
  { id: 'create-order', label: 'Tạo đơn', icon: 'plus', color: '#22C55E', bg: '#E9F9EF' },
  { id: 'orders', label: 'DS Đơn', icon: 'clipboard-text-outline', color: '#F97316', bg: '#FFF2E8' },
  { id: 'commission', label: 'Hoa hồng', icon: 'cash-multiple', color: '#10B981', bg: '#EAFBF6' },
  { id: 'account', label: 'Tài khoản', icon: 'account-outline', color: '#A855F7', bg: '#F3ECFF' },
];

const ORDERS_LIMIT = 5;

export default function HomeScreen() {
  const [recentOrders, setRecentOrders] = useState<RecentOrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [agentName, setAgentName] = useState('FECO X3');

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      async function loadOrders() {
        setOrdersLoading(true);
        setOrdersError('');
        try {
          const [ordersRes, meRes] = await Promise.all([
            ordersService.listMine({ limit: ORDERS_LIMIT }),
            authService.me(),
          ]);
          if (cancelled) return;
          if (meRes.success) {
            const rawName = meRes.data?.agent?.name;
            const normalizedName = typeof rawName === 'string' ? rawName.trim() : '';
            setAgentName(normalizedName || 'FECO X3');
          } else {
            setAgentName('FECO X3');
          }

          if (!ordersRes.success) {
            setOrdersError(ordersRes.message || 'Không tải được đơn hàng.');
            setRecentOrders([]);
            return;
          }
          const rows = (ordersRes.data?.orders ?? []).map(mapOrderToRecentRow);
          setRecentOrders(rows);
        } catch (e) {
          if (!cancelled) {
            setOrdersError(e instanceof Error ? e.message : 'Không tải được đơn hàng.');
            setRecentOrders([]);
            setAgentName('FECO X3');
          }
        } finally {
          if (!cancelled) {
            setOrdersLoading(false);
          }
        }
      }

      void loadOrders();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: Spacings.padding }}>
          <View style={{ paddingHorizontal: Spacings.xxl, paddingTop: Spacings.xl }}>
            <View className="flex-row items-center rounded-xl bg-white px-4 py-3 shadow-sm">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <MaterialCommunityIcons name="clipboard-text-outline" size={24} color="#FB923C" />
              </View>
              <View className="ml-3">
                <Text className="text-sm text-slate-500">Xin chào,</Text>
                <Text className="text-2xl font-semibold tracking-tight text-slate-900">{agentName}</Text>
              </View>
            </View>

            <View className="mt-4 rounded-xl bg-green-500 px-5 py-5 shadow-sm">
              <Text className="text-base font-semibold text-green-100">Doanh số tháng này</Text>
              <Text className="mt-1 text-2xl font-semibold tracking-tight text-white">125.400.000đ</Text>

              <View className="mt-4 flex-row items-end justify-between">
                <View>
                  <Text className="text-xs font-semibold uppercase tracking-wide text-green-100">
                    MỤC TIÊU THÁNG
                  </Text>
                  <Text className="mt-0.5 text-2xl font-semibold tracking-tight text-white">150.000.000đ</Text>
                </View>
                <View className="rounded-md bg-white/20 px-3 py-1">
                  <Text className="text-sm font-semibold text-green-50">83.6%</Text>
                </View>
              </View>

              <View className="mt-3 h-2 w-full rounded-full bg-green-400/50">
                <View className="h-2 w-[84%] rounded-full bg-white" />
              </View>
            </View>

            <View style={{ marginTop: Spacings.xxl }}>
              <Text className="text-base font-semibold text-slate-900">Lối tắt</Text>
              <View className="mt-4 flex-row justify-between">
                {shortcuts.map((item) => (
                  <Pressable
                    key={item.id}
                    className="items-center active:opacity-80"
                    onPress={() => {
                      if (item.id === 'create-order') {
                        router.push('/(main)/create-order');
                        return;
                      }
                      if (item.id === 'orders') {
                        router.push('/(main)/orders');
                        return;
                      }
                      if (item.id === 'commission') {
                        router.push({
                          pathname: '/(main)/commission-history',
                          params: { source: 'home' },
                        });
                        return;
                      }
                      if (item.id === 'account') {
                        router.push('/(main)/account');
                      }
                    }}>
                    <View
                      className="h-14 w-14 items-center justify-center rounded-xl"
                      style={{ backgroundColor: item.bg }}>
                      <MaterialCommunityIcons
                        name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={30}
                        color={item.color}
                      />
                    </View>
                    <Text className="mt-2 text-sm font-semibold text-slate-600">{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={{ marginTop: Spacings.padding }}>
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-slate-900">Đơn hàng gần đây</Text>
                <Pressable onPress={() => router.push('/(main)/orders')}>
                  <Text className="text-base font-semibold text-green-600">Xem tất cả</Text>
                </Pressable>
              </View>

              <View style={{ marginTop: Spacings.xxl, gap: Spacings.xl }}>
                {ordersLoading ? (
                  <View className="items-center py-8">
                    <ActivityIndicator size="small" color="#22C55E" />
                  </View>
                ) : ordersError ? (
                  <Text className="text-center text-sm text-red-600">{ordersError}</Text>
                ) : recentOrders.length === 0 ? (
                  <Text className="text-center text-sm text-slate-500">Chưa có đơn hàng.</Text>
                ) : (
                  recentOrders.map((order) => (
                    <Pressable
                      key={order.id}
                      className="rounded-xl bg-white p-4 shadow-sm active:opacity-90"
                      onPress={() =>
                        router.push({
                          pathname: '/(main)/order-detail',
                          params: { id: order.id, source: 'home' },
                        })
                      }>
                      <View className="flex-row items-start justify-between">
                        <View className="mr-3 flex-1">
                          <Text className="text-base font-semibold text-slate-900">{order.code}</Text>
                          <Text className="mt-1 text-sm text-slate-600">{order.subtitle}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-base font-semibold text-slate-900">{order.amount}</Text>
                          <View
                            className="mt-2 rounded-full px-3 py-1"
                            style={{ backgroundColor: order.statusBg }}>
                            <Text className="text-sm font-semibold" style={{ color: order.statusColor }}>
                              {order.status}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  ))
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
