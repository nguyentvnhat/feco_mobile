import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { authService } from '@/src/features/auth/auth.service';
import type {
  CreateMetadataProduct,
  CreateMetadataProvince,
  CreateMetadataWard,
} from '@/src/features/orders';
import { ordersService } from '@/src/features/orders';

/** Ngày đặt theo lịch Việt Nam (không dùng UTC như toISOString). */
function orderDateYmdVietnamNow() {
  const d = new Date();
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const y = parts.find((p) => p.type === 'year')?.value;
  const m = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  if (y && m && day) return `${y}-${m}-${day}`;
  const local = new Date();
  const yy = local.getFullYear();
  const mm = String(local.getMonth() + 1).padStart(2, '0');
  const dd = String(local.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function normalizeLocationCode(code: string | null | undefined) {
  const raw = String(code ?? '').trim();
  if (!raw) return '';
  return raw.replace(/^0+/, '') || '0';
}

function parseMoneyInput(value?: string | null) {
  if (!value) return 0;
  const digitsOnly = value.replace(/[^\d]/g, '');
  if (!digitsOnly) return 0;
  const parsed = Number.parseInt(digitsOnly, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pickFirstError(errors: Record<string, string>, key: string) {
  return errors[key] || '';
}

function extractNumericPrice(product: CreateMetadataProduct | null) {
  if (!product) return 0;
  const productRecord = product as unknown as Record<string, unknown>;
  const pivot = (productRecord.pivot as Record<string, unknown> | undefined) ?? {};
  const sourceCandidates: unknown[] = [
    product.unit_price,
    productRecord.price,
    productRecord.unitPrice,
    productRecord.product_price,
    productRecord.list_price,
    pivot.unit_price,
    pivot.price,
  ];
  for (const candidate of sourceCandidates) {
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
    if (typeof candidate === 'string') {
      const parsed = parseMoneyInput(candidate);
      if (parsed > 0) return parsed;
    }
  }
  return 0;
}

const defaultTabBarStyle = {
  borderTopWidth: 1,
  borderTopColor: '#E2E8F0',
  backgroundColor: '#FFFFFF',
  paddingTop: 8,
  paddingBottom: 8,
  height: 68,
} as const;

export default function CreateOrderScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();

  const formatMoney = useCallback(
    (value: number) => {
      const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN';
      const formatted = new Intl.NumberFormat(locale).format(value);
      return t('createOrder.moneyFormat', { value: formatted });
    },
    [i18n.language, t],
  );

  const localizeUnitDisplay = useCallback(
    (unit?: string | null) => {
      const normalized = (unit || '').trim().toLowerCase();
      if (normalized === 'box') return t('createOrder.units.box');
      if (normalized === 'bar') return t('createOrder.units.bar');
      return (unit || '').trim();
    },
    [t],
  );
  const navigation = useNavigation();
  const [bootLoading, setBootLoading] = useState(true);
  const [bootError, setBootError] = useState('');
  const [sellerUserId, setSellerUserId] = useState<number | null>(null);
  const [agentProfileId, setAgentProfileId] = useState<number | null>(null);
  const [agentFullAddress, setAgentFullAddress] = useState('');

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
  const [recipientProvinceCode, setRecipientProvinceCode] = useState('');
  const [recipientProvinceLabel, setRecipientProvinceLabel] = useState('');
  const [recipientWardCode, setRecipientWardCode] = useState('');
  const [recipientWardLabel, setRecipientWardLabel] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [provinceCode, setProvinceCode] = useState('');
  const [provinceLabel, setProvinceLabel] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [wardLabel, setWardLabel] = useState('');
  const [address, setAddress] = useState('');

  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isProvinceOpen, setIsProvinceOpen] = useState(false);
  const [isWardOpen, setIsWardOpen] = useState(false);
  const [isRecipientProvinceOpen, setIsRecipientProvinceOpen] = useState(false);
  const [isRecipientWardOpen, setIsRecipientWardOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const wardsForProvince = useMemo(() => {
    const selectedProvince = normalizeLocationCode(provinceCode);
    if (!selectedProvince) return [];
    return wards.filter(
      (w) => normalizeLocationCode(w.province_code) === selectedProvince,
    );
  }, [wards, provinceCode]);
  const recipientWardsForProvince = useMemo(() => {
    const selectedProvince = normalizeLocationCode(recipientProvinceCode);
    if (!selectedProvince) return [];
    return wards.filter(
      (w) => normalizeLocationCode(w.province_code) === selectedProvince,
    );
  }, [wards, recipientProvinceCode]);
  const quantityNumber = useMemo(() => {
    const qty = Number.parseFloat(quantity.trim().replace(',', '.'));
    return Number.isFinite(qty) && qty > 0 ? qty : 0;
  }, [quantity]);
  const selectedProductUnitPrice = useMemo(() => extractNumericPrice(selectedProduct), [selectedProduct]);
  const estimatedSubtotal = useMemo(
    () => Math.round(selectedProductUnitPrice * quantityNumber),
    [selectedProductUnitPrice, quantityNumber],
  );

  function resetForm() {
    setSelectedProduct(null);
    setQuantity('1');
    setOrdererName('');
    setOrdererPhone('');
    setIsSameRecipient(true);
    setRecipientName('');
    setRecipientPhone('');
    setRecipientProvinceCode('');
    setRecipientProvinceLabel('');
    setRecipientWardCode('');
    setRecipientWardLabel('');
    setRecipientAddress('');
    setProvinceCode('');
    setProvinceLabel('');
    setWardCode('');
    setWardLabel('');
    setAddress('');
    setIsProductOpen(false);
    setIsProvinceOpen(false);
    setIsWardOpen(false);
    setIsRecipientProvinceOpen(false);
    setIsRecipientWardOpen(false);
    setFieldErrors({});
  }

  const loadScreen = useCallback(async () => {
    setBootLoading(true);
    setBootError('');
    try {
      const [metaRes, meRes] = await Promise.all([ordersService.fetchCreateMetadata(), authService.me()]);
      if (!metaRes.success) {
        setBootError(metaRes.message || t('createOrder.errors.loadMeta'));
        return;
      }
      if (!meRes.success || !meRes.data?.user?.id) {
        setBootError(meRes.message || t('createOrder.errors.loadSeller'));
        return;
      }
      if (!meRes.data?.agent?.id) {
        setBootError(t('createOrder.errors.loadAgentProfile'));
        return;
      }
      setSellerUserId(meRes.data.user.id);
      setAgentProfileId(meRes.data.agent.id);
      const agentAddr = (meRes.data.agent.full_address ?? '').trim();
      setAgentFullAddress(agentAddr);
      setProducts(metaRes.data?.products ?? []);
      setProvinces(metaRes.data?.provinces ?? []);
      setWards(metaRes.data?.wards ?? []);
    } catch (e) {
      setBootError(e instanceof Error ? e.message : t('createOrder.errors.loadMeta'));
    } finally {
      setBootLoading(false);
    }
  }, [t]);

  useFocusEffect(
    useCallback(() => {
      void loadScreen();
    }, [loadScreen]),
  );

  useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;
    parent.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent.setOptions({ tabBarStyle: defaultTabBarStyle });
    };
  }, [navigation]);

  useEffect(() => {
    if (!isSameRecipient || !agentFullAddress.trim()) return;
    setAddress((prev) => (prev.trim() ? prev : agentFullAddress.trim()));
  }, [agentFullAddress, isSameRecipient]);

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

  function pickRecipientProvince(p: CreateMetadataProvince) {
    setRecipientProvinceCode(p.code);
    setRecipientProvinceLabel(p.name || p.label || p.code);
    setRecipientWardCode('');
    setRecipientWardLabel('');
    setIsRecipientProvinceOpen(false);
    setIsRecipientWardOpen(false);
  }

  function pickRecipientWard(w: CreateMetadataWard) {
    setRecipientWardCode(w.code);
    setRecipientWardLabel(w.name || w.label || w.code);
    setIsRecipientWardOpen(false);
  }

  function pickProduct(p: CreateMetadataProduct) {
    setSelectedProduct(p);
    setIsProductOpen(false);
  }

  async function handleSubmit() {
    setFieldErrors({});
    if (sellerUserId == null) {
      setFieldErrors({ __session: t('createOrder.validation.sellerRequired') });
      return;
    }
    if (!selectedProduct) {
      setFieldErrors({ products: t('createOrder.validation.productRequired') });
      return;
    }
    const qty = Number.parseFloat(quantity.trim().replace(',', '.'));
    if (!Number.isFinite(qty) || qty <= 0) {
      setFieldErrors({ 'products.0.quantity': t('createOrder.validation.quantityMin') });
      return;
    }
    if (!ordererName.trim()) {
      setFieldErrors({ customer_name: t('createOrder.validation.ordererNameRequired') });
      return;
    }
    if (ordererName.trim().length < 3) {
      setFieldErrors({ customer_name: t('createOrder.validation.ordererNameMinLength') });
      return;
    }
    if (!ordererPhone.trim()) {
      setFieldErrors({ customer_phone: t('createOrder.validation.ordererPhoneRequired') });
      return;
    }
    const ordererPhoneDigits = ordererPhone.replace(/\D/g, '');
    if (ordererPhoneDigits.length < 9) {
      setFieldErrors({ customer_phone: t('createOrder.validation.ordererPhoneDigits') });
      return;
    }
    if (!isSameRecipient) {
      if (!recipientName.trim()) {
        setFieldErrors({ customer_name: t('createOrder.validation.recipientNameRequired') });
        return;
      }
      if (recipientName.trim().length < 3) {
        setFieldErrors({ customer_name: t('createOrder.validation.recipientNameMinLength') });
        return;
      }
      if (!recipientPhone.trim()) {
        setFieldErrors({ customer_phone: t('createOrder.validation.recipientPhoneRequired') });
        return;
      }
      const recipientPhoneDigits = recipientPhone.replace(/\D/g, '');
      if (recipientPhoneDigits.length < 9) {
        setFieldErrors({ customer_phone: t('createOrder.validation.recipientPhoneDigits') });
        return;
      }
      if (!recipientProvinceCode) {
        setFieldErrors({ customer_province_code: t('createOrder.validation.recipientProvinceRequired') });
        return;
      }
      if (!recipientWardCode) {
        setFieldErrors({ customer_ward_code: t('createOrder.validation.recipientWardRequired') });
        return;
      }
    }
    if (isSameRecipient && !provinceCode) {
      setFieldErrors({ customer_province_code: t('createOrder.validation.provinceRequired') });
      return;
    }
    if (isSameRecipient && !wardCode) {
      setFieldErrors({ customer_ward_code: t('createOrder.validation.wardRequired') });
      return;
    }
    if (agentProfileId == null) {
      setFieldErrors({ __session: t('createOrder.validation.agentProfileRequired') });
      return;
    }

    setSubmitting(true);
    try {
      const shippingName = isSameRecipient ? ordererName.trim() : recipientName.trim();
      const shippingPhone = isSameRecipient ? ordererPhone.trim() : recipientPhone.trim();
      const shippingProvinceCode = isSameRecipient ? provinceCode : recipientProvinceCode;
      const shippingWardCode = isSameRecipient ? wardCode : recipientWardCode;
      const machineCurrentDate = orderDateYmdVietnamNow();
      const trimmedLine = (isSameRecipient ? address : recipientAddress).trim();
      const shippingAddressLine =
        isSameRecipient && !trimmedLine && agentFullAddress.trim()
          ? agentFullAddress.trim()
          : trimmedLine;
      const res = await ordersService.createOrder({
        order_date: machineCurrentDate,
        seller_user_id: sellerUserId,
        agent_profile_id: agentProfileId,
        order_channel: 'agent_order',
        order_status: 'new',
        customer_name: shippingName,
        customer_phone: shippingPhone,
        customer_address: shippingAddressLine || null,
        customer_province_code: shippingProvinceCode,
        customer_ward_code: shippingWardCode,
        products: [
          {
            product_id: selectedProduct.id,
            quantity: qty,
          },
        ],
      });
      if (!res.success) {
        setFieldErrors({ products: res.message || t('createOrder.errors.createFailed') });
        return;
      }
      const orderNo = (res.data?.order_no ?? '').trim();
      const successBody =
        res.message ||
        (orderNo
          ? t('createOrder.alerts.successMessage', { orderNo })
          : t('createOrder.alerts.successMessageFallback'));
      Alert.alert(t('createOrder.alerts.successTitle'), successBody, [
        { text: t('createOrder.alerts.ok'), onPress: () => router.back() },
      ]);
    } catch (e) {
      const fallbackMessage = e instanceof Error ? e.message : t('createOrder.errors.createFailed');
      const apiError = e as Error & { fieldErrors?: Record<string, string[]> };
      const rawFieldErrors = apiError.fieldErrors ?? {};
      const nextFieldErrors: Record<string, string> = {};
      for (const [key, messages] of Object.entries(rawFieldErrors)) {
        if (Array.isArray(messages) && messages[0]) {
          nextFieldErrors[key] = String(messages[0]);
        }
      }
      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
      } else {
        setFieldErrors({ __session: fallbackMessage });
      }
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
          <Text className="text-lg font-semibold text-slate-900">{t('createOrder.title')}</Text>
        </View>

        {bootLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#16a34a" />
            <Text className="mt-3 text-sm text-slate-600">{t('createOrder.loading')}</Text>
          </View>
        ) : bootError ? (
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-base text-red-600">{bootError}</Text>
            <Pressable className="mt-4 rounded-lg bg-slate-900 px-4 py-3" onPress={() => void loadScreen()}>
              <Text className="font-semibold text-white">{t('createOrder.retry')}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
              <View className="px-4 pt-4">
                <View className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/5">
                  <View className="mb-4 flex-row items-center">
                    <MaterialCommunityIcons name="cube-outline" size={22} color="#16a34a" />
                    <Text className="ml-2 text-base font-semibold text-green-600">{t('createOrder.productInfo')}</Text>
                  </View>

                  <Text className="mb-2 text-xs font-medium text-slate-600">{t('createOrder.selectProduct')}</Text>
                  <Pressable
                    className="mb-4 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3.5 active:bg-slate-50"
                    onPress={() => {
                      setIsProductOpen((prev) => !prev);
                      setIsProvinceOpen(false);
                      setIsWardOpen(false);
                    }}>
                    <Text className={`flex-1 pr-2 text-base ${selectedProduct ? 'text-slate-900' : 'text-slate-400'}`}>
                      {selectedProduct ? `${selectedProduct.name} (${selectedProduct.sku})` : t('createOrder.selectProductPlaceholder')}
                    </Text>
                    <MaterialCommunityIcons
                      name={isProductOpen ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color="#64748b"
                    />
                  </Pressable>
                  {pickFirstError(fieldErrors, 'products') || pickFirstError(fieldErrors, 'products.0.product_id') ? (
                    <Text className="mb-4 text-xs text-red-600">
                      {pickFirstError(fieldErrors, 'products') || pickFirstError(fieldErrors, 'products.0.product_id')}
                    </Text>
                  ) : null}
                  {isProductOpen ? (
                    <View className="mb-4 max-h-52 rounded-lg border border-slate-200 bg-slate-50">
                      <ScrollView nestedScrollEnabled>
                        {products.length === 0 ? (
                          <Text className="px-3 py-4 text-center text-sm text-slate-500">
                            {t('createOrder.noProducts')}
                          </Text>
                        ) : (
                          products.map((item) => (
                            <Pressable
                              key={item.id}
                              className="border-b border-slate-200 px-3 py-3 active:bg-slate-100"
                              onPress={() => pickProduct(item)}>
                              <Text className="text-base font-medium text-slate-900">{item.name}</Text>
                              <Text className="text-sm text-slate-500">
                                {item.sku} · {localizeUnitDisplay(item.base_unit)}
                              </Text>
                            </Pressable>
                          ))
                        )}
                      </ScrollView>
                    </View>
                  ) : null}

                  <Text className="mb-2 text-xs font-medium text-slate-600">{t('createOrder.quantity')}</Text>
                  <View className="mb-2 flex-row items-center rounded-lg border border-slate-200 bg-white px-3 py-3">
                    <TextInput
                      className="min-h-[44px] flex-1 text-base text-slate-900"
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="decimal-pad"
                    />
                    <Text className="text-base text-slate-600">
                      {selectedProduct ? localizeUnitDisplay(selectedProduct.base_unit) : t('createOrder.unit')}
                    </Text>
                  </View>
                  <Text
                    className={`text-xs text-slate-500 ${pickFirstError(fieldErrors, 'products.0.quantity') ? 'mb-2' : 'mb-4'}`}>
                    {t('createOrder.unitPrice')}:{' '}
                    {selectedProductUnitPrice > 0 ? formatMoney(selectedProductUnitPrice) : t('createOrder.noPrice')}
                  </Text>
                  {pickFirstError(fieldErrors, 'products.0.quantity') ? (
                    <Text className="mb-4 text-xs text-red-600">{pickFirstError(fieldErrors, 'products.0.quantity')}</Text>
                  ) : null}
                </View>

                <View className="mt-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/5">
                  <View className="mb-4 flex-row items-center">
                    <MaterialCommunityIcons name="map-marker-outline" size={22} color="#16a34a" />
                    <Text className="ml-2 text-base font-semibold text-green-600">{t('createOrder.shippingInfo')}</Text>
                  </View>
                  <Text className="mb-3 text-sm font-semibold text-slate-800">{t('createOrder.shippingAddress')}</Text>
                  <Text className="mb-2 text-xs font-medium text-slate-600">{t('createOrder.ordererName')}</Text>
                  <TextInput
                    className={`rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-base text-slate-900 ${pickFirstError(fieldErrors, 'customer_name') ? 'mb-2' : 'mb-4'}`}
                    placeholder={t('createOrder.ordererNamePlaceholder')}
                    placeholderTextColor="#94a3b8"
                    value={ordererName}
                    onChangeText={setOrdererName}
                  />
                  {pickFirstError(fieldErrors, 'customer_name') ? (
                    <Text className="mb-4 text-xs text-red-600">{pickFirstError(fieldErrors, 'customer_name')}</Text>
                  ) : null}

                  <Text className="mb-2 text-xs font-medium text-slate-600">{t('createOrder.ordererPhone')}</Text>
                  <TextInput
                    className={`rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-base text-slate-900 ${pickFirstError(fieldErrors, 'customer_phone') ? 'mb-2' : 'mb-4'}`}
                    placeholder={t('createOrder.phonePlaceholder')}
                    placeholderTextColor="#94a3b8"
                    value={ordererPhone}
                    onChangeText={setOrdererPhone}
                    keyboardType="phone-pad"
                  />
                  {pickFirstError(fieldErrors, 'customer_phone') ? (
                    <Text className="mb-4 text-xs text-red-600">{pickFirstError(fieldErrors, 'customer_phone')}</Text>
                  ) : null}



                  <Text className="mb-2 text-xs font-medium text-slate-600">{t('createOrder.province')}</Text>
                  <Pressable
                    className="mb-4 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3.5 active:bg-slate-50"
                    onPress={() => {
                      setIsProvinceOpen((prev) => !prev);
                      setIsProductOpen(false);
                      setIsWardOpen(false);
                    }}>
                    <Text className={`flex-1 pr-2 text-base ${provinceCode ? 'text-slate-900' : 'text-slate-400'}`}>
                      {provinceCode ? provinceLabel : t('createOrder.provincePlaceholder')}
                    </Text>
                    <MaterialCommunityIcons
                      name={isProvinceOpen ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color="#64748b"
                    />
                  </Pressable>
                  {pickFirstError(fieldErrors, 'customer_province_code') ? (
                    <Text className="mb-4 text-xs text-red-600">
                      {pickFirstError(fieldErrors, 'customer_province_code')}
                    </Text>
                  ) : null}
                  {isProvinceOpen ? (
                    <View className="mb-4 max-h-52 rounded-lg border border-slate-200 bg-slate-50">
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

                  <Text className="mb-2 text-xs font-medium text-slate-600">{t('createOrder.ward')}</Text>
                  <Pressable
                    className="mb-4 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3.5 active:bg-slate-50"
                    onPress={() => {
                      if (!provinceCode) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          customer_province_code: t('createOrder.validation.provinceBeforeWard'),
                        }));
                        return;
                      }
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.customer_province_code;
                        return next;
                      });
                      setIsWardOpen((prev) => !prev);
                      setIsProductOpen(false);
                      setIsProvinceOpen(false);
                    }}>
                    <Text className={`flex-1 pr-2 text-base ${wardCode ? 'text-slate-900' : 'text-slate-400'}`}>
                      {wardCode ? wardLabel : t('createOrder.wardPlaceholder')}
                    </Text>
                    <MaterialCommunityIcons
                      name={isWardOpen ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color="#64748b"
                    />
                  </Pressable>
                  {pickFirstError(fieldErrors, 'customer_ward_code') ? (
                    <Text className="mb-4 text-xs text-red-600">{pickFirstError(fieldErrors, 'customer_ward_code')}</Text>
                  ) : null}
                  {isWardOpen ? (
                    <View className="mb-4 max-h-52 rounded-lg border border-slate-200 bg-slate-50">
                      <ScrollView nestedScrollEnabled>
                        {wardsForProvince.length === 0 ? (
                          <Text className="px-3 py-4 text-center text-sm text-slate-500">
                            {t('createOrder.noWards')}
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

                  <Text className="mb-2 text-xs font-medium text-slate-600">{t('createOrder.streetAddress')}</Text>
                  <TextInput
                    className={`min-h-[88px] rounded-lg border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 ${pickFirstError(fieldErrors, 'customer_address') ? 'mb-2' : 'mb-4'}`}
                    multiline
                    placeholder={t('createOrder.streetAddressPlaceholder')}
                    placeholderTextColor="#94a3b8"
                    textAlignVertical="top"
                    value={address}
                    onChangeText={setAddress}
                  />
                  {pickFirstError(fieldErrors, 'customer_address') ? (
                    <Text className="mb-4 text-xs text-red-600">{pickFirstError(fieldErrors, 'customer_address')}</Text>
                  ) : null}

                  <Pressable
                    className="mt-4 flex-row items-center"
                    onPress={() => {
                      setIsSameRecipient((prev) => {
                        const next = !prev;
                        if (next && !address.trim() && agentFullAddress.trim()) {
                          setAddress(agentFullAddress.trim());
                        }
                        return next;
                      });
                    }}>
                    <MaterialCommunityIcons
                      name={isSameRecipient ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={22}
                      color={isSameRecipient ? '#16a34a' : '#64748b'}
                    />
                    <Text className="ml-2 text-sm text-slate-700">
                      {t('createOrder.sameRecipient')}
                    </Text>
                  </Pressable>

                  {!isSameRecipient ? (
                    <>
                      <Text className="mt-4 mb-3 text-sm font-semibold text-slate-800">{t('createOrder.recipientAddress')}</Text>
                      <Text className="mb-2 text-xs font-medium text-slate-600">{t('createOrder.recipientName')}</Text>
                      <TextInput
                        className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-base text-slate-900"
                        placeholder={t('createOrder.recipientNamePlaceholder')}
                        placeholderTextColor="#94a3b8"
                        value={recipientName}
                        onChangeText={setRecipientName}
                      />

                      <Text className="mb-2 text-xs font-medium text-slate-600">
                        {t('createOrder.recipientPhone')}
                      </Text>
                      <TextInput
                        className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-base text-slate-900"
                        placeholder={t('createOrder.recipientPhonePlaceholder')}
                        placeholderTextColor="#94a3b8"
                        value={recipientPhone}
                        onChangeText={setRecipientPhone}
                        keyboardType="phone-pad"
                      />

                      <Text className="mb-2 text-xs font-medium text-slate-600">{t('createOrder.province')}</Text>
                      <Pressable
                        className="mb-4 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3.5 active:bg-slate-50"
                        onPress={() => {
                          setIsRecipientProvinceOpen((prev) => !prev);
                          setIsProductOpen(false);
                          setIsProvinceOpen(false);
                          setIsWardOpen(false);
                          setIsRecipientWardOpen(false);
                        }}>
                        <Text className={`flex-1 pr-2 text-base ${recipientProvinceCode ? 'text-slate-900' : 'text-slate-400'}`}>
                          {recipientProvinceCode ? recipientProvinceLabel : t('createOrder.provincePlaceholder')}
                        </Text>
                        <MaterialCommunityIcons
                          name={isRecipientProvinceOpen ? 'chevron-up' : 'chevron-down'}
                          size={22}
                          color="#64748b"
                        />
                      </Pressable>
                      {pickFirstError(fieldErrors, 'customer_province_code') ? (
                        <Text className="mb-4 text-xs text-red-600">
                          {pickFirstError(fieldErrors, 'customer_province_code')}
                        </Text>
                      ) : null}
                      {isRecipientProvinceOpen ? (
                        <View className="mb-4 max-h-52 rounded-lg border border-slate-200 bg-slate-50">
                          <ScrollView nestedScrollEnabled>
                            {provinces.map((item) => (
                              <Pressable
                                key={item.code}
                                className="border-b border-slate-200 px-3 py-3 active:bg-slate-100"
                                onPress={() => pickRecipientProvince(item)}>
                                <Text className="text-base text-slate-900">{item.name}</Text>
                                <Text className="text-sm text-slate-500">{item.label}</Text>
                              </Pressable>
                            ))}
                          </ScrollView>
                        </View>
                      ) : null}

                      <Text className="mb-2 text-xs font-medium text-slate-600">{t('createOrder.ward')}</Text>
                      <Pressable
                        className="mb-4 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3.5 active:bg-slate-50"
                        onPress={() => {
                          if (!recipientProvinceCode) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              customer_province_code: t('createOrder.validation.recipientProvinceBeforeWard'),
                            }));
                            return;
                          }
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.customer_province_code;
                            return next;
                          });
                          setIsRecipientWardOpen((prev) => !prev);
                          setIsProductOpen(false);
                          setIsProvinceOpen(false);
                          setIsWardOpen(false);
                          setIsRecipientProvinceOpen(false);
                        }}>
                        <Text className={`flex-1 pr-2 text-base ${recipientWardCode ? 'text-slate-900' : 'text-slate-400'}`}>
                          {recipientWardCode ? recipientWardLabel : t('createOrder.wardPlaceholder')}
                        </Text>
                        <MaterialCommunityIcons
                          name={isRecipientWardOpen ? 'chevron-up' : 'chevron-down'}
                          size={22}
                          color="#64748b"
                        />
                      </Pressable>
                      {pickFirstError(fieldErrors, 'customer_ward_code') ? (
                        <Text className="mb-4 text-xs text-red-600">{pickFirstError(fieldErrors, 'customer_ward_code')}</Text>
                      ) : null}
                      {isRecipientWardOpen ? (
                        <View className="mb-4 max-h-52 rounded-lg border border-slate-200 bg-slate-50">
                          <ScrollView nestedScrollEnabled>
                            {recipientWardsForProvince.length === 0 ? (
                              <Text className="px-3 py-4 text-center text-sm text-slate-500">
                                {t('createOrder.noWards')}
                              </Text>
                            ) : (
                              recipientWardsForProvince.map((item) => (
                                <Pressable
                                  key={item.code}
                                  className="border-b border-slate-200 px-3 py-3 active:bg-slate-100"
                                  onPress={() => pickRecipientWard(item)}>
                                  <Text className="text-base text-slate-900">{item.name}</Text>
                                  <Text className="text-sm text-slate-500">{item.label}</Text>
                                </Pressable>
                              ))
                            )}
                          </ScrollView>
                  </View>
                      ) : null}

                      <Text className="mb-2 text-xs font-medium text-slate-600">{t('createOrder.streetAddress')}</Text>
                      <TextInput
                        className="mb-4 min-h-[88px] rounded-lg border border-slate-200 bg-white px-3 py-3 text-base text-slate-900"
                        multiline
                        placeholder={t('createOrder.streetAddressPlaceholder')}
                        placeholderTextColor="#94a3b8"
                        textAlignVertical="top"
                        value={recipientAddress}
                        onChangeText={setRecipientAddress}
                      />
                    </>
                  ) : null}

                </View>

                <View className="mt-6 px-1">
                  {pickFirstError(fieldErrors, '__session') ? (
                    <Text className="mb-2 text-xs text-red-600">{pickFirstError(fieldErrors, '__session')}</Text>
                  ) : null}
                  <View className="mb-2 flex-row items-center justify-between">
                    <Text className="text-base text-slate-700">{t('createOrder.shippingFeeEstimate')}</Text>
                    <Text className="text-base text-slate-700">{t('createOrder.shippingFeeToBeAgreed')}</Text>
                  </View>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-base font-bold text-slate-900">{t('createOrder.subtotal')}</Text>
                    <Text className="text-base font-bold text-green-600">{formatMoney(estimatedSubtotal)}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View
              className="absolute left-0 right-0 border-t border-slate-200 bg-white px-4 py-3"
              style={{ bottom: 0, paddingBottom: 5 }}>
              <Pressable
                className={`flex-row items-center justify-center rounded-xl py-3.5 ${submitting ? 'bg-slate-400' : 'bg-green-600 active:bg-green-700'}`}
                disabled={submitting}
                onPress={() => void handleSubmit()}>
                {submitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle-outline" size={22} color="#ffffff" />
                    <Text className="ml-2 text-base font-bold text-white">{t('createOrder.confirm')}</Text>
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
