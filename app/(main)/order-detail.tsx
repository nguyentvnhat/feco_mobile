import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRefetchOnReconnect } from '@/hooks/use-network';
import {
  appendCurrency,
  formatOrderDateTime,
  formatTierLimitLabel,
  getOrderStatusPresentation,
  ordersService,
} from '@/src/features/orders';
import type { OrderDetailData, OrderDetailProduct } from '@/src/features/orders';
import { toUserFacingMessage } from '@/src/lib/user-facing-error';

function withCurrencySuffix(value?: string | null) {
  if (!value) return '--';
  const trimmed = value.trim();
  return trimmed.endsWith('đ') ? trimmed : `${trimmed}đ`;
}

function localizeUnit(unit?: string | null) {
  const normalized = (unit || '').trim().toLowerCase();
  if (normalized === 'box') return 'hộp';
  if (normalized === 'bar') return 'thanh';
  return unit || '';
}

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{
    id?: string | string[];
    source?: string | string[];
    agentId?: string | string[];
    agentName?: string | string[];
    historySource?: string | string[];
  }>();
  const [loading, setLoading] = useState(true);
  const [reorderLoading, setReorderLoading] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [isDiscountDetailOpen, setIsDiscountDetailOpen] = useState(false);
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const historySource = Array.isArray(params.historySource) ? params.historySource[0] : params.historySource;
  const agentId = Array.isArray(params.agentId) ? params.agentId[0] : params.agentId;
  const agentName = Array.isArray(params.agentName) ? params.agentName[0] : params.agentName;

  function handleBack() {
    if (source === 'home') {
      router.replace('/(main)');
      return;
    }
    if (source === 'commission-history') {
      router.replace({
        pathname: '/(main)/commission-history',
        params: { source: historySource || 'account' },
      });
      return;
    }
    if (source === 'discount-history') {
      router.replace({
        pathname: '/(main)/discount-history',
        params: { source: historySource || 'account' },
      });
      return;
    }
    if (source === 'orders') {
      router.replace('/(main)/orders');
      return;
    }
    if (source === 'agent-orders' && agentId) {
      router.replace({
        pathname: '/(main)/agent-orders',
        params: {
          agentId,
          agentName: agentName || 'Đại lý',
        },
      });
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(main)');
  }

  const orderId = Array.isArray(params.id) ? params.id[0] : params.id;

  const loadDetail = useCallback(async () => {
    if (!orderId) {
      setError('Thiếu mã đơn hàng.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const detailRes = await ordersService.detail(orderId);
      if (!detailRes.success) {
        setError(toUserFacingMessage(detailRes.message, 'Không tải được chi tiết đơn hàng.'));
        setOrder(null);
        return;
      }
      setOrder(detailRes.data);
    } catch (e) {
      setError(toUserFacingMessage(e, 'Không tải được chi tiết đơn hàng.'));
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useRefetchOnReconnect(loadDetail);

  const products = useMemo<OrderDetailProduct[]>(() => order?.products ?? [], [order]);
  const hasInvoiceFile = order?.has_invoice_file === true;
  const hasDeliveryReceipt = order?.has_delivery_receipt_paths === true;
  const displayOrderNo = useMemo(() => {
    if (!order?.order_no) return '--';
    return order.order_no.startsWith('#') ? order.order_no : `#${order.order_no}`;
  }, [order?.order_no]);
  const shippingAddress = useMemo(() => {
    const addressParts = [order?.customer_address ?? '', order?.customer_ward ?? '', order?.customer_city ?? '']
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    return addressParts.join(', ');
  }, [order?.customer_address, order?.customer_ward, order?.customer_city]);
  const pickupAddress = useMemo(() => {
    const addressParts = [
      order?.pickup?.address_line ?? '',
      order?.pickup?.ward_name ?? '',
      order?.pickup?.province_name ?? '',
    ]
      .map((part) => part.trim())
      .filter((part) => part.length > 0);
    return addressParts.join(', ');
  }, [order?.pickup?.address_line, order?.pickup?.ward_name, order?.pickup?.province_name]);
  const hasDiscount = useMemo(() => {
    const raw = (order?.discount_amount ?? '').replace(/\./g, '').replace(',', '.').trim();
    if (!raw) return false;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0;
  }, [order?.discount_amount]);
  const discountDetailTiers = useMemo(() => {
    const tiers = Array.isArray(order?.applied_tiers) ? order.applied_tiers : [];
    return tiers.map((tier, index) => ({
      key: String(tier.commission_policy_tier_id ?? `applied-${index}`),
      label: formatTierLimitLabel({
        tierLimitLabel: tier.tier_limit_label,
        minValue: tier.min_value,
        maxValue: tier.max_value,
        rewardPercent: tier.reward_percent,
        rewardAmountPerUnit: tier.reward_amount_per_unit,
      }),
      amount: appendCurrency(
        tier.discount_amount == null ? null : String(tier.discount_amount),
        order?.currency,
      ),
    }));
  }, [order?.applied_tiers, order?.currency]);
  const hasDiscountTiers = discountDetailTiers.length > 0;
  const vatRateLabel = useMemo(() => {
    const rate = order?.vat_rate_percent;
    if (rate == null || !Number.isFinite(rate)) return '0';
    return String(Number(rate.toFixed(2)));
  }, [order?.vat_rate_percent]);
  const statusPresentation = useMemo(() => {
    if (!order) return null;
    return getOrderStatusPresentation(order.order_status, order.order_label_status);
  }, [order]);
  const normalizedOrderStatus = (order?.order_status || '').trim().toLowerCase();
  const hideCancelButton = normalizedOrderStatus !== 'new';

  async function handleReorder() {
    const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!orderId || reorderLoading) return;

    setReorderLoading(true);
    try {
      const res = await ordersService.cloneTemplate(orderId);
      if (!res.success || !res.data?.clone_payload) {
        Alert.alert('Không thể đặt lại', toUserFacingMessage(res.message, 'Không lấy được dữ liệu đơn hàng để đặt lại.'));
        return;
      }

      router.push({
        pathname: '/(main)/create-order',
        params: {
          clone_payload: JSON.stringify(res.data.clone_payload),
          clone_source_order_no: res.data.source_order?.order_no || '',
        },
      });
    } catch (e) {
      Alert.alert(
        'Không thể đặt lại',
        toUserFacingMessage(e, 'Không lấy được dữ liệu đơn hàng để đặt lại.'),
      );
    } finally {
      setReorderLoading(false);
    }
  }

  async function executeCancelOrder() {
    const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
    if (!orderId || cancelLoading) return;

    setCancelLoading(true);
    try {
      const res = await ordersService.cancelOrder(orderId);
      if (!res.success) {
        Alert.alert('Không thể huỷ đơn', toUserFacingMessage(res.message, 'Không thể huỷ đơn hàng lúc này.'));
        return;
      }

      Alert.alert('Huỷ đơn thành công', toUserFacingMessage(res.message, 'Đơn hàng đã được huỷ.'), [
        {
          text: 'Đồng ý',
          onPress: () => router.replace('/(main)/orders'),
        },
      ]);
    } catch (e) {
      Alert.alert('Không thể huỷ đơn', toUserFacingMessage(e, 'Không thể huỷ đơn hàng lúc này.'));
    } finally {
      setCancelLoading(false);
    }
  }

  function handleCancelOrder() {
    if (!order || cancelLoading) return;

    const orderNo = order.order_no || '--';
    if (normalizedOrderStatus === 'new') {
      Alert.alert('Xác nhận huỷ đơn', `Bạn có chắc muốn huỷ đơn ${orderNo}?`, [
        { text: 'Không', style: 'cancel' },
        { text: 'Huỷ đơn', style: 'destructive', onPress: () => void executeCancelOrder() },
      ]);
      return;
    }

    Alert.alert(
      'Không thể huỷ đơn',
      `Bạn không thể huỷ đơn ${orderNo}. Vui lòng liên hệ Quản trị để được hỗ trợ`,
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-3">
          <Pressable
            className="mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
            onPress={handleBack}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#0f172a" />
          </Pressable>
          <Text className="text-lg font-semibold text-slate-900">Chi Tiết Đơn Hàng</Text>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-24 pt-4">
          <View className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mã đơn hàng</Text>
            <Text className="mt-1 text-lg font-semibold text-slate-900">{displayOrderNo}</Text>

            <View className="mt-3 flex-row items-center justify-between">
              <View
                className="flex-row items-center rounded-full px-3 py-1.5"
                style={{ backgroundColor: hasInvoiceFile ? '#ECFDF5' : '#F1F5F9' }}>
                <MaterialCommunityIcons
                  name={hasInvoiceFile ? 'check-circle-outline' : 'clock-outline'}
                  size={15}
                  color={hasInvoiceFile ? '#22C55E' : '#64748B'}
                />
                <Text className="ml-1 text-sm font-semibold" style={{ color: hasInvoiceFile ? '#22C55E' : '#64748B' }}>
                  Hoá đơn
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
                  Biên nhận
                </Text>
              </View>
            </View>

            <View className="mt-4 flex-row border-t border-slate-100 pt-3">
              <View className="w-2/5 pr-2">
                <Text className="text-sm text-slate-400">Ngày đặt</Text>
                <Text className="text-base font-semibold text-slate-900">{formatOrderDateTime(order?.order_date)}</Text>
              </View>
              <View className="flex-1 pl-2">
                <Text className="text-sm text-slate-400">Trạng thái</Text>
                {statusPresentation ? (
                  <View
                    className="mt-1 self-start rounded-md px-3 py-1"
                    style={{ backgroundColor: statusPresentation.bgColor }}>
                    <Text
                      className="text-sm font-semibold"
                      style={{ color: statusPresentation.textColor }}>
                      {statusPresentation.label}
                    </Text>
                  </View>
                ) : (
                  <Text className="mt-1 text-base font-semibold text-slate-900">--</Text>
                )}
              </View>
            </View>
          </View>

          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <View className="mb-3 flex-row items-center">
              <Ionicons name="location-outline" size={18} color="#22c55e" />
              <Text className="ml-2 text-base font-semibold text-slate-900">THÔNG TIN GIAO HÀNG</Text>
            </View>
            <Text className="text-base font-semibold text-slate-900">{order?.customer_name || '--'}</Text>
            <Text className="mt-1 text-base font-semibold text-slate-400">{order?.customer_phone || '--'}</Text>
            <Text className="mt-1 text-base font-semibold text-slate-400">{shippingAddress}</Text>
          </View>

          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <View className="mb-3 flex-row items-center">
              <Ionicons name="cube-outline" size={18} color="#22c55e" />
              <Text className="ml-2 text-base font-semibold text-slate-900">THÔNG TIN LẤY HÀNG</Text>
            </View>
            <Text className="text-base font-semibold text-slate-900">{order?.pickup?.full_name || '--'}</Text>
            <Text className="mt-1 text-base font-semibold text-slate-400">{order?.pickup?.phone || '--'}</Text>
            <Text className="mt-1 text-base font-semibold text-slate-400">{pickupAddress || '--'}</Text>
          </View>

          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <Text className="text-base font-semibold text-slate-900">DANH SÁCH SẢN PHẨM</Text>
            <View className="mt-3">
              {loading ? (
                <View className="items-center py-6">
                  <ActivityIndicator size="small" color="#22c55e" />
                </View>
              ) : error ? (
                <Text className="text-sm text-red-600">{error}</Text>
              ) : products.length === 0 ? (
                <Text className="text-sm text-slate-500">Không có sản phẩm.</Text>
              ) : (
                products.map((item) => (
                  <View key={item.id} className="mb-3 flex-row items-center rounded-xl bg-slate-50 px-3 py-3">
                    <View className="h-12 w-12 items-center justify-center rounded-md bg-white">
                      {item.image_path ? (
                        <Image
                          source={{ uri: item.image_path }}
                          contentFit="cover"
                          style={{ width: 48, height: 48, borderRadius: 8 }}
                        />
                      ) : (
                        <MaterialCommunityIcons name="package-variant-closed" size={24} color="#1e293b" />
                      )}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-semibold text-slate-800">{item.product_name}</Text>
                      <Text className="text-sm text-slate-400">
                        x {item.quantity} {localizeUnit(item.unit)}
                      </Text>
                    </View>
                    <Text className="text-base font-semibold text-slate-900">
                      {withCurrencySuffix(item.line_amount)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>

          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-slate-400">Tạm tính</Text>
              <Text className="text-lg font-semibold text-slate-900">
                {withCurrencySuffix(order?.subtotal_amount)}
              </Text>
            </View>
            {hasDiscount ? (
              <View className="mt-1 flex-row items-start justify-between">
                <View className="mr-3 shrink">
                  <Text className="text-base text-green-500">Chiết khấu</Text>
                  {hasDiscountTiers ? (
                    <Pressable
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => setIsDiscountDetailOpen(true)}>
                      <Text className="mt-0.5 text-sm text-green-700 underline">(xem chi tiết)</Text>
                    </Pressable>
                  ) : null}
                </View>
                <Text className="text-lg font-semibold text-green-500">
                  -{withCurrencySuffix(order?.discount_amount)}
                </Text>
              </View>
            ) : null}
            <View className="mt-1 flex-row items-center justify-between">
              <Text className="text-base text-slate-400">Giá tính VAT</Text>
              <Text className="text-lg font-semibold text-slate-900">
                {withCurrencySuffix(order?.vat_base ?? order?.net_amount)}
              </Text>
            </View>
            <View className="mt-1 flex-row items-center justify-between">
              <Text className="text-base text-slate-400">VAT {vatRateLabel}%</Text>
              <Text className="text-lg font-semibold text-slate-900">
                {order?.vat_amount?.trim() ? `+${withCurrencySuffix(order.vat_amount)}` : '--'}
              </Text>
            </View>
            <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
              <Text className="text-base font-semibold text-slate-900">Tổng thanh toán</Text>
              <Text className="text-xl font-bold text-green-500">
                {withCurrencySuffix(order?.total_with_vat ?? order?.net_amount)}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View className="border-t border-slate-200 bg-white px-4 py-3">
          <Pressable
            className={`items-center justify-center rounded-xl py-3.5 ${
              reorderLoading ? 'bg-green-300' : 'bg-green-500 active:bg-green-600'
            }`}
            disabled={reorderLoading}
            onPress={() => void handleReorder()}>
            {reorderLoading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">Đặt lại</Text>
            )}
          </Pressable>
          {!hideCancelButton ? (
            <Pressable
              className={`mt-2 items-center justify-center rounded-xl py-3.5 ${
                cancelLoading ? 'bg-rose-300' : 'bg-rose-500 active:bg-rose-600'
              }`}
              disabled={cancelLoading}
              onPress={handleCancelOrder}>
              {cancelLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="text-base font-semibold text-white">Huỷ đơn</Text>
              )}
            </Pressable>
          ) : null}
        </View>

        <Modal
          visible={isDiscountDetailOpen && hasDiscountTiers}
          transparent
          animationType="fade"
          onRequestClose={() => setIsDiscountDetailOpen(false)}>
          <View className="flex-1 items-center justify-center bg-black/45 px-6">
            <Pressable
              accessibilityRole="button"
              className="absolute inset-0"
              onPress={() => setIsDiscountDetailOpen(false)}
            />
            <View className="w-full max-w-md rounded-2xl bg-white p-5">
              <Text className="text-lg font-semibold text-slate-900">Chi tiết chiết khấu</Text>
              {order?.discount_amount ? (
                <Text className="mt-1 text-sm text-green-700">
                  Chiết khấu: -{withCurrencySuffix(order.discount_amount)}
                </Text>
              ) : null}

              <View className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled>
                  {discountDetailTiers.map((tier, index) => {
                    const key = tier.key || `tier-${index}`;
                    return (
                      <View
                        key={key}
                        className={`bg-white px-3 py-3 ${
                          index > 0 ? 'border-t border-slate-100' : ''
                        }`}>
                        <View className="flex-row items-start justify-between gap-3">
                          <Text className="flex-1 text-base leading-6 text-slate-800">
                            {tier.label || `Tier #${index + 1}`}
                          </Text>
                          {tier.amount ? (
                            <Text className="text-base font-semibold text-green-600">
                              -{tier.amount}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>

              <Pressable
                className="mt-4 items-center rounded-xl bg-green-600 px-4 py-3 active:bg-green-700"
                onPress={() => setIsDiscountDetailOpen(false)}>
                <Text className="text-base font-semibold text-white">Đóng</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}
