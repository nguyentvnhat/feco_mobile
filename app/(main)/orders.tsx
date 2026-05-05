import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appendCurrency, getOrderStatusPresentation, ordersService } from '@/src/features/orders';
import type { OrderListItem, OrderStatusItem } from '@/src/features/orders';

type StatusTab = {
  key: string;
  label: string;
};

const PAGE_SIZE = 5;

function localizeUnit(unit?: string | null) {
  const normalized = (unit || '').trim().toLowerCase();
  if (normalized === 'box') return 'hộp';
  if (normalized === 'bar') return 'thanh';
  return unit || '';
}

export default function OrdersScreen() {
  const { t } = useTranslation();
  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [tabs, setTabs] = useState<StatusTab[]>([{ key: 'all', label: t('orders.all') }]);
  const [activeTab, setActiveTab] = useState('all');
  const [navigatingOrderId, setNavigatingOrderId] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useFocusEffect(
    useCallback(() => {
      setActiveTab('all');
      setNavigatingOrderId(null);
      setVisibleCount(PAGE_SIZE);
    }, []),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    if (!isFocused) return;
    let cancelled = false;

    async function loadOrders() {
      setLoading(true);
      setError('');
      try {
        const keyword = debouncedSearch.trim();
        const [ordersRes, statusesRes] = await Promise.all([
          keyword ? ordersService.search({ q: keyword }) : ordersService.listMine(),
          ordersService.statuses(),
        ]);
        if (cancelled) return;
        if (!ordersRes.success) {
          setError(ordersRes.message || t('orders.errors.loadFailed'));
          setOrders([]);
          setTabs([{ key: 'all', label: t('orders.all') }]);
          return;
        }

        const rows = ordersRes.data?.orders ?? [];
        setOrders(rows);
        setVisibleCount(PAGE_SIZE);
        const statusTabs: StatusTab[] =
          statusesRes.success && Array.isArray(statusesRes.data?.statuses)
            ? statusesRes.data.statuses.map((s: OrderStatusItem) => ({ key: s.value, label: s.label }))
            : [];
        setTabs([{ key: 'all', label: t('orders.all') }, ...statusTabs]);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : t('orders.errors.loadFailed'));
          setOrders([]);
          setTabs([{ key: 'all', label: t('orders.all') }]);
          setVisibleCount(PAGE_SIZE);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, [isFocused, debouncedSearch, t]);

  const filteredOrders = useMemo(() => {
    if (activeTab === 'all') return orders;
    return orders.filter((o) => o.order_status === activeTab);
  }, [orders, activeTab]);

  const visibleOrders = useMemo(() => filteredOrders.slice(0, visibleCount), [filteredOrders, visibleCount]);
  const hasMore = visibleCount < filteredOrders.length;

  function handleListScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (loading || !hasMore) return;
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const threshold = 80;
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
    if (isNearBottom) {
      setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredOrders.length));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="border-b border-slate-200 bg-white px-3 pb-1 pt-2">
          <Text className="text-lg font-semibold text-slate-900">{t('orders.title')}</Text>
          <View className="mt-2 flex-row items-center rounded-xl bg-slate-100 px-3 py-3">
            <Feather name="search" size={20} color="#94a3b8" />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder={t('orders.searchPlaceholder')}
              placeholderTextColor="#94a3b8"
              className="ml-2 flex-1 text-base text-slate-700"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
            <View className="flex-row gap-2">
              {tabs.map((tab) => (
                <Pressable
                  key={tab.key}
                  className={`rounded-xl px-4 py-2 ${
                    activeTab === tab.key ? 'border border-green-100 bg-green-50' : ''
                  }`}
                  onPress={() => {
                    setActiveTab(tab.key);
                    setVisibleCount(PAGE_SIZE);
                  }}>
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

        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-28 pt-4"
          onScroll={handleListScroll}
          scrollEventThrottle={16}>
          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="small" color="#22c55e" />
            </View>
          ) : error ? (
            <Text className="text-center text-sm text-red-600">{error}</Text>
          ) : filteredOrders.length === 0 ? (
            <View className="items-center py-16">
              <View className="h-28 w-28 items-center justify-center rounded-full bg-green-50">
                <MaterialCommunityIcons name="inbox-outline" size={42} color="#22c55e" />
              </View>
              <Text className="mt-3 text-center text-sm font-medium text-slate-500">{t('orders.empty')}</Text>
            </View>
          ) : (
            <>
              {visibleOrders.map((order) => {
              const status = getOrderStatusPresentation(order.order_status, order.order_label_status);
              const hasInvoiceFile = order.has_invoice_file === true;
              const hasDeliveryReceipt = order.has_delivery_receipt_paths === true;
              const code = order.order_no.startsWith('#') ? order.order_no : `#${order.order_no}`;
              const customer = order.customer?.customer_name || t('orders.customerFallback');
              const firstProduct = order.products?.[0];
              const isNavigating = navigatingOrderId === order.id;
              return (
                <Pressable
                  key={order.id}
                  className="relative mb-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5 active:opacity-95"
                  disabled={isNavigating}
                  onPress={() => {
                    setNavigatingOrderId(order.id);
                    router.push({
                      pathname: '/(main)/order-detail',
                      params: { id: String(order.id), source: 'orders' },
                    });
                  }}>
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text className="text-sm font-semibold tracking-wide text-slate-400">{code}</Text>
                      <Text className="mt-1 text-base font-semibold text-slate-900">{customer}</Text>
                    </View>
                    <View
                      className="max-w-[45%] rounded-md px-3 py-1"
                      style={{ backgroundColor: status.bgColor }}>
                      <Text
                        className="text-xs font-semibold"
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={{ color: status.textColor }}>
                        {status.label}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4 flex-row items-center rounded-xl bg-slate-50 px-3 py-3">
                    <View className="h-12 w-12 items-center justify-center rounded-md bg-white">
                      {firstProduct?.image_path ? (
                        <Image
                          source={{ uri: firstProduct.image_path }}
                          contentFit="cover"
                          style={{ width: 48, height: 48, borderRadius: 8 }}
                        />
                      ) : (
                        <MaterialCommunityIcons name="package-variant-closed" size={24} color="#1e293b" />
                      )}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-semibold text-slate-700">
                        {firstProduct?.product_name || `${t('orders.orderLabel')} ${code}`}
                      </Text>
                      <Text className="mt-0.5 text-sm text-slate-400">
                        {firstProduct
                          ? `x ${firstProduct.quantity} ${localizeUnit(firstProduct.unit)}`.trim()
                          : order.order_date
                            ? new Date(order.order_date).toLocaleDateString('vi-VN')
                            : '--'}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4 flex-row items-end justify-between border-t border-slate-100 pt-3">
                    <View>
                      <Text className="text-sm text-slate-400">{t('orders.total')}</Text>
                      <Text className="text-lg font-semibold text-slate-900">
                        {appendCurrency(order.net_amount, order.currency)}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-2">
                      <View
                        className="flex-row items-center rounded-full px-3 py-1.5"
                        style={{ backgroundColor: hasInvoiceFile ? '#ECFDF5' : '#F1F5F9' }}>
                        <MaterialCommunityIcons
                          name={hasInvoiceFile ? 'check-circle-outline' : 'clock-outline'}
                          size={15}
                          color={hasInvoiceFile ? '#22C55E' : '#64748B'}
                        />
                        <Text
                          className="ml-1 text-sm font-semibold"
                          style={{ color: hasInvoiceFile ? '#22C55E' : '#64748B' }}>
                          {t('orders.invoice')}
                        </Text>
                      </View>
                      <View
                        className="flex-row items-center rounded-full px-3 py-1.5"
                        style={{ backgroundColor: hasDeliveryReceipt ? '#ECFDF5' : '#F1F5F9' }}>
                        <MaterialCommunityIcons
                          name={hasDeliveryReceipt ? 'check-circle-outline' : 'clock-outline'}
                          size={15}
                          color={hasDeliveryReceipt ? '#22C55E' : '#64748B'}
                        />
                        <Text
                          className="ml-1 text-sm font-semibold"
                          style={{ color: hasDeliveryReceipt ? '#22C55E' : '#64748B' }}>
                          {t('orders.receipt')}
                        </Text>
                      </View>
                    </View>
                  </View>
                  {isNavigating ? (
                    <View className="absolute inset-0 items-center justify-center rounded-2xl bg-white/60">
                      <ActivityIndicator size="small" color="#22c55e" />
                    </View>
                  ) : null}
                </Pressable>
              );
              })}
              {hasMore ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color="#22c55e" />
                </View>
              ) : null}
            </>
          )}
        </ScrollView>

        <Pressable
          className="absolute bottom-24 right-5 h-16 w-16 items-center justify-center rounded-full bg-green-500 shadow-lg shadow-green-400/40 active:bg-green-600"
          onPress={() => router.push('/(main)/create-order')}>
          <Ionicons name="add" size={34} color="#ffffff" />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
