import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/features/auth/auth.service';
import { mapOrderToRecentRow, ordersService } from '@/src/features/orders';
import type { RecentOrderRow } from '@/src/features/orders';
import { Spacings } from '@/src/theme';

const ORDERS_LIMIT = 5;

function withCurrencySuffix(value?: string | null) {
  if (value == null || value === '') return '--';
  const trimmed = String(value).trim();
  if (trimmed === '--') return '--';
  return trimmed.endsWith('đ') ? trimmed : `${trimmed}đ`;
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const [recentOrders, setRecentOrders] = useState<RecentOrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [agentName, setAgentName] = useState('FECO X3');
  const [monthRevenue, setMonthRevenue] = useState('--');
  const [monthCommission, setMonthCommission] = useState('--');

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
            const agent = meRes.data?.agent;
            const rawName = agent?.name;
            const normalizedName = typeof rawName === 'string' ? rawName.trim() : '';
            setAgentName(normalizedName || 'FECO X3');
            const rev = agent?.month_revenue;
            const com = agent?.month_commission;
            setMonthRevenue(typeof rev === 'string' && rev.trim() ? withCurrencySuffix(rev) : '--');
            setMonthCommission(typeof com === 'string' && com.trim() ? withCurrencySuffix(com) : '--');
          } else {
            setAgentName('FECO X3');
            setMonthRevenue('--');
            setMonthCommission('--');
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
            setMonthRevenue('--');
            setMonthCommission('--');
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
                <Text className="text-sm text-slate-500">{t('home.greeting')}</Text>
                <Text className="text-2xl font-semibold tracking-tight text-slate-900">{agentName}</Text>
              </View>
            </View>

            <View className="mt-4 rounded-xl bg-green-500 px-5 py-5 shadow-sm">
              <Text className="text-base font-semibold text-green-100">{t('home.monthRevenue')}</Text>
              <Text className="mt-1 text-2xl font-semibold tracking-tight text-white">{monthRevenue}</Text>

              <View className="mt-5 border-t border-white/20 pt-4">
                <Text className="text-base font-semibold text-green-100">{t('home.monthCommission')}</Text>
                <Text className="mt-1 text-2xl font-semibold tracking-tight text-white">{monthCommission}</Text>
              </View>
            </View>

            <View style={{ marginTop: Spacings.xxl }}>
              <Text className="text-base font-semibold text-slate-900">{t('home.shortcuts')}</Text>
              <View className="mt-4 flex-row justify-between">
                {[
                  { id: 'create-order', label: t('home.shortcutCreateOrder'), icon: 'plus', color: '#22C55E', bg: '#E9F9EF' },
                  { id: 'orders', label: t('home.shortcutOrders'), icon: 'clipboard-text-outline', color: '#F97316', bg: '#FFF2E8' },
                  { id: 'commission', label: t('home.shortcutCommission'), icon: 'cash-multiple', color: '#10B981', bg: '#EAFBF6' },
                  { id: 'account', label: t('home.shortcutAccount'), icon: 'account-outline', color: '#A855F7', bg: '#F3ECFF' },
                ].map((item) => (
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
                <Text className="text-base font-semibold text-slate-900">{t('home.recentOrders')}</Text>
                <Pressable onPress={() => router.push('/(main)/orders')}>
                  <Text className="text-base font-semibold text-green-600">{t('home.viewAll')}</Text>
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
                  <View className="items-center rounded-2xl border border-dashed border-sky-100 bg-white px-5 py-10">
                    <View className="h-28 w-28 items-center justify-center rounded-full bg-green-50">
                      <MaterialCommunityIcons name="shopping-outline" size={42} color="#22c55e" />
                    </View>
                    <Text className="mt-6 text-lg font-semibold text-slate-900">{t('home.emptyTitle')}</Text>
                    <Text className="mt-2 text-center text-sm text-slate-400">
                      {t('home.emptySubtitle')}
                    </Text>
                  </View>
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
