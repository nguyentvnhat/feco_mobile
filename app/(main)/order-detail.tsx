import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ordersService } from '@/src/features/orders';
import type { OrderDetailData, OrderDetailProduct, OrderStatusItem } from '@/src/features/orders';

function withCurrencySuffix(value?: string | null) {
  if (!value) return '--';
  const trimmed = value.trim();
  return trimmed.endsWith('đ') ? trimmed : `${trimmed}đ`;
}

function formatDateTime(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const datePart = d.toLocaleDateString('vi-VN');
  const timePart = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} ${timePart}`;
}

export default function OrderDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[]; source?: string | string[] }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<OrderDetailData | null>(null);
  const [statusSteps, setStatusSteps] = useState<OrderStatusItem[]>([]);
  const source = Array.isArray(params.source) ? params.source[0] : params.source;

  function handleBack() {
    if (source === 'home') {
      router.replace('/(main)');
      return;
    }
    if (source === 'orders') {
      router.replace('/(main)/orders');
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(main)');
  }

  useEffect(() => {
    let cancelled = false;

    async function loadDetail() {
      const orderId = Array.isArray(params.id) ? params.id[0] : params.id;
      if (!orderId) {
        setError('Thiếu mã đơn hàng.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');
      try {
        const [detailRes, statusesRes] = await Promise.all([
          ordersService.detail(orderId),
          ordersService.statuses(),
        ]);
        if (cancelled) return;
        if (!detailRes.success) {
          setError(detailRes.message || 'Không tải được chi tiết đơn hàng.');
          setOrder(null);
          return;
        }
        setOrder(detailRes.data);
        if (statusesRes.success) {
          setStatusSteps(statusesRes.data?.statuses ?? []);
        } else {
          setStatusSteps([]);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Không tải được chi tiết đơn hàng.');
          setOrder(null);
          setStatusSteps([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadDetail();
    return () => {
      cancelled = true;
    };
  }, [params.id]);

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
  const timelineItems = useMemo(() => {
    const currentStatus = (order?.order_status || '').trim();
    const currentIndex = statusSteps.findIndex((s) => s.value === currentStatus);
    const displayTime = formatDateTime(order?.order_date);
    return statusSteps
      .map((step, idx) => {
      const active = currentIndex >= 0 ? idx <= currentIndex : step.value === currentStatus;
      return {
        id: step.value,
        title: step.label,
        time: active ? displayTime : '',
        active,
      };
      })
      .filter((step) => step.active);
  }, [order?.order_status, order?.order_date, statusSteps]);
  const hasDiscount = useMemo(() => {
    const raw = (order?.discount_amount ?? '').replace(/\./g, '').replace(',', '.').trim();
    if (!raw) return false;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0;
  }, [order?.discount_amount]);

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-3">
          <Pressable
            className="mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
            onPress={handleBack}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#0f172a" />
          </Pressable>
          <Text className="text-2xl font-semibold tracking-tight text-slate-900">Chi Tiết Đơn Hàng</Text>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-24 pt-4">
          <View className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mã đơn hàng</Text>
            <Text className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{displayOrderNo}</Text>

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
                <Text className="text-base font-semibold text-slate-900">
                  {order?.order_date ? new Date(order.order_date).toLocaleString('vi-VN') : '--'}
                </Text>
              </View>
              <View className="flex-1 pl-2">
                <Text className="text-sm text-slate-400">Trạng thái</Text>
                <Text className="text-base font-semibold text-slate-900">{order?.order_label_status || '--'}</Text>
              </View>
            </View>
          </View>

          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <Text className="text-xl font-semibold text-slate-900">TRẠNG THÁI ĐƠN HÀNG</Text>
            <View className="mt-3">
              {timelineItems.map((step, idx) => (
                <View key={step.id} className="flex-row">
                  <View className="mr-3 items-center">
                    <View
                      className={`h-6 w-6 items-center justify-center rounded-full ${
                        step.active ? 'bg-green-500' : 'bg-slate-200'
                      }`}>
                      <Ionicons
                        name={step.active ? 'checkmark' : 'ellipse'}
                        size={step.active ? 14 : 10}
                        color={step.active ? '#fff' : '#94a3b8'}
                      />
                    </View>
                    {idx < timelineItems.length - 1 ? <View className="h-9 w-0.5 bg-slate-200" /> : null}
                  </View>
                  <View className="pb-3">
                    <Text className={`text-base font-semibold ${step.active ? 'text-slate-900' : 'text-slate-300'}`}>
                      {step.title}
                    </Text>
                    {step.time ? (
                      <Text className={`text-sm ${step.active ? 'text-slate-500' : 'text-slate-300'}`}>{step.time}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <View className="mb-3 flex-row items-center">
              <Ionicons name="location-outline" size={18} color="#22c55e" />
              <Text className="ml-2 text-xl font-semibold text-slate-900">THÔNG TIN GIAO HÀNG</Text>
            </View>
            <Text className="text-base font-semibold text-slate-900">{order?.customer_name || '--'}</Text>
            <Text className="mt-1 text-base font-semibold text-slate-400">{order?.customer_phone || '--'}</Text>
            <Text className="mt-1 text-base font-semibold text-slate-400">{shippingAddress}</Text>
          </View>

          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <Text className="text-xl font-semibold text-slate-900">DANH SÁCH SẢN PHẨM</Text>
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
                        x {item.quantity} {item.unit || ''}
                      </Text>
                    </View>
                    <Text className="text-2xl font-semibold tracking-tight text-slate-900">
                      {withCurrencySuffix(item.line_amount)}
                    </Text>
                  </View>
                ))
              )}
            </View>
          </View>

          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-slate-400">Tổng tiền hàng</Text>
              <Text className="text-2xl font-semibold tracking-tight text-slate-900">
                {withCurrencySuffix(order?.subtotal_amount)}
              </Text>
            </View>
            {hasDiscount ? (
              <View className="mt-1 flex-row items-center justify-between">
                <Text className="text-base text-green-500">Chiết khấu</Text>
                <Text className="text-2xl font-semibold tracking-tight text-green-500">
                  -{withCurrencySuffix(order?.discount_amount)}
                </Text>
              </View>
            ) : null}
            <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
              <Text className="text-xl font-semibold text-slate-900">Tổng thanh toán</Text>
              <Text className="text-3xl font-bold text-green-500">
                {withCurrencySuffix(order?.net_amount)}
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* <View className="border-t border-slate-200 bg-white px-4 py-3">
          <View className="flex-row gap-3">
            <Pressable className="flex-1 items-center justify-center rounded-xl border border-slate-200 py-3.5 active:bg-slate-50">
              <Text className="text-base font-semibold text-slate-700">Liên Hệ Hỗ Trợ</Text>
            </Pressable>
            <Pressable className="flex-1 flex-row items-center justify-center rounded-xl bg-green-500 py-3.5 active:bg-green-600">
              <Feather name="file-text" size={18} color="#fff" />
              <Text className="ml-2 text-base font-semibold text-white">Xem hóa đơn</Text>
            </Pressable>
          </View>
        </View> */}
      </View>
    </SafeAreaView>
  );
}
