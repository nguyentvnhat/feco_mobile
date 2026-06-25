import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { agentsService } from '@/src/features/agents';
import { appendCurrency, getOrderStatusPresentation } from '@/src/features/orders';
import type { OrderListItem } from '@/src/features/orders';

const PAGE_SIZE = 10;

function localizeUnit(unit?: string | null) {
  const normalized = (unit || '').trim().toLowerCase();
  if (normalized === 'box') return 'hộp';
  if (normalized === 'bar') return 'thanh';
  return unit || '';
}

function mergeOrderPages(previous: OrderListItem[], incoming: OrderListItem[]) {
  if (incoming.length === 0) return previous;
  const seen = new Set(previous.map((order) => order.id));
  const appended = incoming.filter((order) => !seen.has(order.id));
  return appended.length > 0 ? [...previous, ...appended] : previous;
}

export default function AgentOrdersScreen() {
  const params = useLocalSearchParams<{
    agentId?: string | string[];
    agentName?: string | string[];
  }>();
  const agentId = Number(Array.isArray(params.agentId) ? params.agentId[0] : params.agentId);
  const agentName = (Array.isArray(params.agentName) ? params.agentName[0] : params.agentName)?.trim() || 'Đại lý';

  const isFocused = useIsFocused();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const loadingMoreRef = useRef(false);
  const userHasScrolledRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  const fetchOrdersPage = useCallback(
    async (pageNum: number, replace: boolean) => {
      if (!Number.isFinite(agentId) || agentId <= 0) {
        throw new Error('Không xác định được đại lý.');
      }

      const ordersRes = await agentsService.listChildOrders(agentId, {
        q: debouncedSearch || undefined,
        limit: PAGE_SIZE,
        page: pageNum,
      });

      if (!ordersRes.success) {
        throw new Error(ordersRes.message || 'Không tải được danh sách đơn hàng.');
      }

      const rows = ordersRes.data?.orders ?? [];
      const meta = ordersRes.data?.meta;

      setOrders((prev) => (replace ? rows : mergeOrderPages(prev, rows)));
      setPage(pageNum);
      setHasMore(meta?.has_more ?? rows.length >= PAGE_SIZE);
    },
    [agentId, debouncedSearch],
  );

  useEffect(() => {
    if (!isFocused) return;
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setLoadingMore(false);
      loadingMoreRef.current = false;
      setError('');
      setPage(1);
      setHasMore(false);
      setOrders([]);
      userHasScrolledRef.current = false;

      try {
        await fetchOrdersPage(1, true);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Không tải được danh sách đơn hàng.');
          setOrders([]);
          setHasMore(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, [isFocused, debouncedSearch, fetchOrdersPage]);

  const handleLoadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current || !hasMore) return;
    if (!userHasScrolledRef.current) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      await fetchOrdersPage(page + 1, false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được danh sách đơn hàng.');
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [fetchOrdersPage, hasMore, loading, page]);

  const handleListScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      if (contentOffset.y > 8) {
        userHasScrolledRef.current = true;
      }

      const threshold = 100;
      const nearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - threshold;
      if (nearBottom) {
        void handleLoadMore();
      }
    },
    [handleLoadMore],
  );

  const renderOrderItem = useCallback(
    ({ item: order }: { item: OrderListItem }) => {
      const status = getOrderStatusPresentation(order.order_status, order.order_label_status);
      const hasInvoiceFile = order.has_invoice_file === true;
      const hasDeliveryReceipt = order.has_delivery_receipt_paths === true;
      const code = order.order_no.startsWith('#') ? order.order_no : `#${order.order_no}`;
      const customer = order.customer?.customer_name || 'Khách hàng';
      const firstProduct = order.products?.[0];

      return (
        <View className="mb-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-semibold tracking-wide text-slate-400">{code}</Text>
              <Text className="mt-1 text-base font-semibold text-slate-900">{customer}</Text>
            </View>
            <View className="max-w-[45%] rounded-md px-3 py-1" style={{ backgroundColor: status.bgColor }}>
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
                {firstProduct?.product_name || `Đơn hàng ${code}`}
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
              <Text className="text-sm text-slate-400">Thành tiền (trước VAT)</Text>
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
                <Text className="ml-1 text-sm font-semibold" style={{ color: hasInvoiceFile ? '#22C55E' : '#64748B' }}>
                  Hóa đơn
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
                  Biên bản
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    },
    [],
  );

  const listFooter = useMemo(() => {
    if (loadingMore) {
      return (
        <View className="items-center py-4">
          <ActivityIndicator size="small" color="#22c55e" />
        </View>
      );
    }
    return <View className="h-4" />;
  }, [loadingMore]);

  const listEmpty = useMemo(() => {
    if (loading) {
      return (
        <View className="items-center py-10">
          <ActivityIndicator size="small" color="#22c55e" />
        </View>
      );
    }
    if (error) {
      return <Text className="text-center text-sm text-red-600">{error}</Text>;
    }
    return (
      <View className="items-center py-16">
        <View className="h-28 w-28 items-center justify-center rounded-full bg-green-50">
          <MaterialCommunityIcons name="inbox-outline" size={42} color="#22c55e" />
        </View>
        <Text className="mt-3 text-center text-sm font-medium text-slate-500">Chưa có đơn hàng nào</Text>
      </View>
    );
  }, [error, loading]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="border-b border-slate-200 bg-white px-3 pb-3 pt-2">
          <View className="flex-row items-center">
            <Pressable
              className="mr-1 h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
              onPress={() => router.replace('/(main)/agents')}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#0f172a" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-lg font-semibold text-slate-900">Đơn hàng đại lý</Text>
              <Text className="text-sm text-slate-500" numberOfLines={1}>
                {agentName}
              </Text>
            </View>
          </View>
          <View className="mt-2 flex-row items-center rounded-xl bg-slate-100 px-3 py-3">
            <Feather name="search" size={20} color="#94a3b8" />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Tìm theo mã đơn hoặc khách hàng..."
              placeholderTextColor="#94a3b8"
              className="ml-2 flex-1 text-base text-slate-700"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
          </View>
        </View>

        <FlatList
          className="flex-1"
          data={orders}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderOrderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, flexGrow: 1 }}
          onScrollBeginDrag={() => {
            userHasScrolledRef.current = true;
          }}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          onEndReached={() => void handleLoadMore()}
          onEndReachedThreshold={0.25}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={hasMore || loadingMore ? listFooter : null}
        />
      </View>
    </SafeAreaView>
  );
}
