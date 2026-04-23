import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { authService } from '@/src/features/auth/auth.service';
import type {
  CreateMetadataProduct,
  CreateMetadataProvince,
  CreateMetadataWard,
} from '@/src/features/orders';
import { ordersService } from '@/src/features/orders';

function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeLocationCode(code: string | null | undefined) {
  const raw = String(code ?? '').trim();
  if (!raw) return '';
  return raw.replace(/^0+/, '') || '0';
}

export default function CreateOrderScreen() {
  const [bootLoading, setBootLoading] = useState(true);
  const [bootError, setBootError] = useState('');
  const [sellerUserId, setSellerUserId] = useState<number | null>(null);

  const [products, setProducts] = useState<CreateMetadataProduct[]>([]);
  const [provinces, setProvinces] = useState<CreateMetadataProvince[]>([]);
  const [wards, setWards] = useState<CreateMetadataWard[]>([]);

  const [selectedProduct, setSelectedProduct] = useState<CreateMetadataProduct | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [ordererName, setOrdererName] = useState('');
  const [ordererPhone, setOrdererPhone] = useState('');
  const [isSameRecipient, setIsSameRecipient] = useState(true);
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [provinceLabel, setProvinceLabel] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [wardLabel, setWardLabel] = useState('');
  const [address, setAddress] = useState('');
  const [orderDate, setOrderDate] = useState(todayYmd());

  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isProvinceOpen, setIsProvinceOpen] = useState(false);
  const [isWardOpen, setIsWardOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const wardsForProvince = useMemo(() => {
    const selectedProvince = normalizeLocationCode(provinceCode);
    if (!selectedProvince) return [];
    return wards.filter(
      (w) => normalizeLocationCode(w.province_code) === selectedProvince,
    );
  }, [wards, provinceCode]);

  function resetForm() {
    setSelectedProduct(null);
    setQuantity('1');
    setOrdererName('');
    setOrdererPhone('');
    setIsSameRecipient(true);
    setRecipientName('');
    setRecipientPhone('');
    setProvinceCode('');
    setProvinceLabel('');
    setWardCode('');
    setWardLabel('');
    setAddress('');
    setOrderDate(todayYmd());
    setIsProductOpen(false);
    setIsProvinceOpen(false);
    setIsWardOpen(false);
    setFormError('');
  }

  const loadScreen = useCallback(async () => {
    setBootLoading(true);
    setBootError('');
    try {
      const [metaRes, meRes] = await Promise.all([ordersService.fetchCreateMetadata(), authService.me()]);
      if (!metaRes.success) {
        setBootError(metaRes.message || 'Không tải được dữ liệu đơn hàng.');
        return;
      }
      if (!meRes.success || !meRes.data?.user?.id) {
        setBootError(meRes.message || 'Không xác định được người bán (seller).');
        return;
      }
      setSellerUserId(meRes.data.user.id);
      setProducts(metaRes.data?.products ?? []);
      setProvinces(metaRes.data?.provinces ?? []);
      setWards(metaRes.data?.wards ?? []);
    } catch (e) {
      setBootError(e instanceof Error ? e.message : 'Không tải được dữ liệu.');
    } finally {
      setBootLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadScreen();
  }, [loadScreen]);

  function pickProvince(p: CreateMetadataProvince) {
    setProvinceCode(p.code);
    setProvinceLabel(p.name || p.label || p.code);
    setWardCode('');
    setWardLabel('');
    setIsProvinceOpen(false);
    setIsWardOpen(false);
  }

  function pickWard(w: CreateMetadataWard) {
    setWardCode(w.code);
    setWardLabel(w.name || w.label || w.code);
    setIsWardOpen(false);
  }

  function pickProduct(p: CreateMetadataProduct) {
    setSelectedProduct(p);
    setIsProductOpen(false);
  }

  async function handleSubmit() {
    setFormError('');
    if (sellerUserId == null) {
      setFormError('Thiếu thông tin người bán. Vui lòng đăng nhập lại.');
      return;
    }
    if (!selectedProduct) {
      setFormError('Vui lòng chọn sản phẩm.');
      return;
    }
    if (!ordererName.trim()) {
      setFormError('Vui lòng nhập tên người đặt.');
      return;
    }
    if (ordererName.trim().length < 3) {
      setFormError('Tên người đặt phải có ít nhất 3 ký tự.');
      return;
    }
    if (!ordererPhone.trim()) {
      setFormError('Vui lòng nhập số điện thoại.');
      return;
    }
    if (!isSameRecipient) {
      if (!recipientName.trim()) {
        setFormError('Vui lòng nhập tên người nhận.');
        return;
      }
      if (recipientName.trim().length < 3) {
        setFormError('Tên người nhận phải có ít nhất 3 ký tự.');
        return;
      }
      if (!recipientPhone.trim()) {
        setFormError('Vui lòng nhập số điện thoại người nhận.');
        return;
      }
    }
    if (!provinceCode) {
      setFormError('Vui lòng chọn tỉnh / thành phố.');
      return;
    }
    if (!wardCode) {
      setFormError('Vui lòng chọn phường / xã.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(orderDate.trim())) {
      setFormError('Ngày giao hàng dự kiến dùng định dạng YYYY-MM-DD.');
      return;
    }

    setSubmitting(true);
    try {
      const shippingName = isSameRecipient ? ordererName.trim() : recipientName.trim();
      const shippingPhone = isSameRecipient ? ordererPhone.trim() : recipientPhone.trim();
      const res = await ordersService.createOrder({
        order_date: orderDate.trim(),
        seller_user_id: sellerUserId,
        order_channel: 'direct_sale',
        order_status: 'new',
        customer_name: shippingName,
        customer_phone: shippingPhone,
        customer_address: address.trim() || null,
        customer_province_code: provinceCode,
        customer_ward_code: wardCode,
      });
      if (!res.success) {
        setFormError(res.message || 'Tạo đơn thất bại.');
        return;
      }
      Alert.alert('Thành công', res.message || `Đơn ${res.data?.order_no ?? ''} đã được tạo.`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Tạo đơn thất bại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-3">
          <Pressable
            className="mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
            onPress={() => {
              resetForm();
              router.back();
            }}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#0f172a" />
          </Pressable>
          <Text className="text-lg font-semibold text-slate-900">Tạo Đơn Hàng</Text>
        </View>

        {bootLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#16a34a" />
            <Text className="mt-3 text-sm text-slate-600">Đang tải…</Text>
          </View>
        ) : bootError ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-base text-red-600">{bootError}</Text>
            <Pressable className="mt-4 rounded-lg bg-slate-900 px-4 py-3" onPress={() => void loadScreen()}>
              <Text className="font-semibold text-white">Thử lại</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="px-4 pb-36 pt-4">
                {formError ? (
                  <Text className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{formError}</Text>
                ) : null}

                <View className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/5">
                  <View className="mb-4 flex-row items-center">
                    <MaterialCommunityIcons name="cube-outline" size={22} color="#16a34a" />
                    <Text className="ml-2 text-base font-semibold text-green-600">Thông tin sản phẩm</Text>
                  </View>

                  <Text className="mb-1.5 text-xs font-medium text-slate-600">Chọn sản phẩm</Text>
                  <Pressable
                    className="mb-4 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3.5 active:bg-slate-50"
                    onPress={() => {
                      setIsProductOpen((prev) => !prev);
                      setIsProvinceOpen(false);
                      setIsWardOpen(false);
                    }}>
                    <Text className={`flex-1 pr-2 text-base ${selectedProduct ? 'text-slate-900' : 'text-slate-400'}`}>
                      {selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku})` : '-- Chọn sản phẩm từ kho --'}
                    </Text>
                    <MaterialCommunityIcons
                      name={isProductOpen ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color="#64748b"
                    />
                  </Pressable>
                  {isProductOpen ? (
                    <View className="mb-4 max-h-52 rounded-lg border border-slate-200 bg-slate-50">
                      <ScrollView nestedScrollEnabled>
                        {products.length === 0 ? (
                          <Text className="px-3 py-4 text-center text-sm text-slate-500">
                            Không có sản phẩm trong kho.
                          </Text>
                        ) : (
                          products.map((item) => (
                            <Pressable
                              key={item.id}
                              className="border-b border-slate-200 px-3 py-3 active:bg-slate-100"
                              onPress={() => pickProduct(item)}>
                              <Text className="text-base font-medium text-slate-900">{item.name}</Text>
                              <Text className="text-sm text-slate-500">
                                {item.sku} · {item.base_unit}
                              </Text>
                            </Pressable>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  ) : null}

                  <Text className="mb-1.5 text-xs font-medium text-slate-600">Số lượng đặt hàng</Text>
                  <View className="flex-row items-center rounded-lg border border-slate-200 bg-white px-3 py-3">
                    <TextInput
                      className="min-h-[44px] flex-1 text-base text-slate-900"
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="decimal-pad"
                    />
                    <Text className="text-base text-slate-600">{selectedProduct?.base_unit ?? 'Đơn vị'}</Text>
                  </View>
                </View>

                <View className="mt-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/5">
                  <View className="mb-4 flex-row items-center">
                    <MaterialCommunityIcons name="map-marker-outline" size={22} color="#16a34a" />
                    <Text className="ml-2 text-base font-semibold text-green-600">Thông tin giao hàng</Text>
                  </View>

                  <Text className="mb-1.5 text-xs font-medium text-slate-600">Tên người đặt</Text>
                  <TextInput
                    className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-base text-slate-900"
                    placeholder="Nhập tên người đặt"
                    placeholderTextColor="#94a3b8"
                    value={ordererName}
                    onChangeText={setOrdererName}
                  />

                  <Text className="mb-1.5 text-xs font-medium text-slate-600">Số điện thoại</Text>
                  <TextInput
                    className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-base text-slate-900"
                    placeholder="0900000000"
                    placeholderTextColor="#94a3b8"
                    value={ordererPhone}
                    onChangeText={setOrdererPhone}
                    keyboardType="phone-pad"
                  />

                  <Pressable
                    className="mb-4 flex-row items-center"
                    onPress={() => setIsSameRecipient((prev) => !prev)}>
                    <MaterialCommunityIcons
                      name={isSameRecipient ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={22}
                      color={isSameRecipient ? '#16a34a' : '#64748b'}
                    />
                    <Text className="ml-2 text-sm text-slate-700">
                      Thông tin người đặt hàng và người nhận hàng giống nhau
                    </Text>
                  </Pressable>

                  {!isSameRecipient ? (
                    <>
                      <Text className="mb-1.5 text-xs font-medium text-slate-600">Tên người nhận</Text>
                      <TextInput
                        className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-base text-slate-900"
                        placeholder="Nhập tên người nhận hàng"
                        placeholderTextColor="#94a3b8"
                        value={recipientName}
                        onChangeText={setRecipientName}
                      />

                      <Text className="mb-1.5 text-xs font-medium text-slate-600">
                        Số điện thoại người nhận
                      </Text>
                      <TextInput
                        className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-base text-slate-900"
                        placeholder="0900000000"
                        placeholderTextColor="#94a3b8"
                        value={recipientPhone}
                        onChangeText={setRecipientPhone}
                        keyboardType="phone-pad"
                      />
                    </>
                  ) : null}

                  <Text className="mb-2 text-sm font-semibold text-slate-800">Địa chỉ nhận hàng</Text>

                  <Text className="mb-1.5 text-xs font-medium text-slate-600">Tỉnh / Thành phố</Text>
                  <Pressable
                    className="mb-3 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3.5 active:bg-slate-50"
                    onPress={() => {
                      setIsProvinceOpen((prev) => !prev);
                      setIsProductOpen(false);
                      setIsWardOpen(false);
                    }}>
                    <Text className={`flex-1 pr-2 text-base ${provinceCode ? 'text-slate-900' : 'text-slate-400'}`}>
                      {provinceCode ? provinceLabel : 'Chọn tỉnh / thành phố'}
                    </Text>
                    <MaterialCommunityIcons
                      name={isProvinceOpen ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color="#64748b"
                    />
                  </Pressable>
                  {isProvinceOpen ? (
                    <View className="mb-3 max-h-52 rounded-lg border border-slate-200 bg-slate-50">
                      <ScrollView nestedScrollEnabled>
                        {provinces.map((item) => (
                          <Pressable
                            key={item.code}
                            className="border-b border-slate-200 px-3 py-3 active:bg-slate-100"
                            onPress={() => pickProvince(item)}>
                            <Text className="text-base text-slate-900">{item.name}</Text>
                            <Text className="text-sm text-slate-500">{item.label}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    </View>
                  ) : null}

                  <Text className="mb-1.5 text-xs font-medium text-slate-600">Phường / Xã</Text>
                  <Pressable
                    className="mb-3 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3.5 active:bg-slate-50"
                    onPress={() => {
                      if (!provinceCode) {
                        setFormError('Vui lòng chọn tỉnh / thành phố trước.');
                        return;
                      }
                      setFormError('');
                      setIsWardOpen((prev) => !prev);
                      setIsProductOpen(false);
                      setIsProvinceOpen(false);
                    }}>
                    <Text className={`flex-1 pr-2 text-base ${wardCode ? 'text-slate-900' : 'text-slate-400'}`}>
                      {wardCode ? wardLabel : 'Chọn phường / xã'}
                    </Text>
                    <MaterialCommunityIcons
                      name={isWardOpen ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color="#64748b"
                    />
                  </Pressable>
                  {isWardOpen ? (
                    <View className="mb-3 max-h-52 rounded-lg border border-slate-200 bg-slate-50">
                      <ScrollView nestedScrollEnabled>
                        {wardsForProvince.length === 0 ? (
                          <Text className="px-3 py-4 text-center text-sm text-slate-500">
                            Không có phường/xã cho tỉnh đã chọn.
                          </Text>
                        ) : (
                          wardsForProvince.map((item) => (
                            <Pressable
                              key={item.code}
                              className="border-b border-slate-200 px-3 py-3 active:bg-slate-100"
                              onPress={() => pickWard(item)}>
                              <Text className="text-base text-slate-900">{item.name}</Text>
                              <Text className="text-sm text-slate-500">{item.label}</Text>
                            </Pressable>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  ) : null}

                  <Text className="mb-1.5 text-xs font-medium text-slate-600">Số nhà, tên đường</Text>
                  <TextInput
                    className="mb-4 min-h-[88px] rounded-lg border border-slate-200 bg-white px-3 py-3 text-base text-slate-900"
                    multiline
                    placeholder="Số nhà, tên đường..."
                    placeholderTextColor="#94a3b8"
                    textAlignVertical="top"
                    value={address}
                    onChangeText={setAddress}
                  />

                  <Text className="mb-1.5 text-xs font-medium text-slate-600">Ngày giao hàng dự kiến (YYYY-MM-DD)</Text>
                  <View className="flex-row items-center rounded-lg border border-slate-200 bg-white px-3 py-3">
                    <TextInput
                      className="flex-1 text-base text-slate-900"
                      placeholder="2026-04-17"
                      placeholderTextColor="#94a3b8"
                      value={orderDate}
                      onChangeText={setOrderDate}
                    />
                    <MaterialCommunityIcons name="calendar-month-outline" size={22} color="#64748b" />
                  </View>
                </View>

                <View className="mt-6 px-1">
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-base text-slate-700">Phí vận chuyển dự kiến:</Text>
                    <Text className="text-base text-slate-700">Thỏa thuận sau</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-slate-900">Tạm tính:</Text>
                    <Text className="text-base font-bold text-green-600">0 VNĐ</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-4 py-3">
              <Pressable
                className={`flex-row items-center justify-center rounded-xl py-3.5 ${submitting ? 'bg-slate-400' : 'bg-green-600 active:bg-green-700'}`}
                disabled={submitting}
                onPress={() => void handleSubmit()}>
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle-outline" size={22} color="#ffffff" />
                    <Text className="ml-2 text-base font-bold text-white">Xác Nhận Đặt Hàng</Text>
                  </>
                )}
              </Pressable>
            </View>

          </>
        )}
      </View>
    </SafeAreaView>
  );
}
