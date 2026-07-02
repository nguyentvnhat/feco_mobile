import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
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

import { useRefetchOnReconnect } from '@/hooks/use-network';
import { authService } from '@/src/features/auth/auth.service';
import type { MeResponse } from '@/src/features/auth/auth.types';
import type {
  CloneOrderTemplatePayload,
  CreateMetadataProduct,
  CreateMetadataProvince,
  CreateMetadataWard,
  PreviewOrderSummary,
} from '@/src/features/orders';
import { appendCurrency, ordersService } from '@/src/features/orders';
import { toUserFacingMessage } from '@/src/lib/user-facing-error';

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

function pickFirstError(errors: Record<string, string>, key: string) {
  return errors[key] || '';
}

function formatProductUnitPriceLabel(
  product: CreateMetadataProduct | null,
  fallback: string,
): string {
  if (!product) return fallback;
  const formatted = appendCurrency(product.unit_price, product.currency);
  return formatted !== '--' ? formatted : fallback;
}

function normalizeLocationName(value: string) {
  const stripped = value
    .trim()
    .replace(/^(tinh|thanh pho|quan|huyen|thi xa|phuong|xa|thi tran)\s+/i, '');
  return stripped
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function locationCodesEqual(a: string, b: string) {
  const left = String(a ?? '').trim();
  const right = String(b ?? '').trim();
  if (!left || !right) return false;
  return left === right || normalizeLocationCode(left) === normalizeLocationCode(right);
}

function findProvinceByCode(provinces: CreateMetadataProvince[], code: string) {
  const trimmed = code.trim();
  if (!trimmed) return null;
  return provinces.find((province) => locationCodesEqual(province.code, trimmed)) ?? null;
}

function findWardByCode(wards: CreateMetadataWard[], provinceCode: string, wardCode: string) {
  const trimmedWard = wardCode.trim();
  if (!trimmedWard || !provinceCode.trim()) return null;
  return (
    wards.find(
      (ward) =>
        locationCodesEqual(ward.province_code, provinceCode) && locationCodesEqual(ward.code, trimmedWard),
    ) ?? null
  );
}

function findProvinceMatch(provinces: CreateMetadataProvince[], cityName: string) {
  const target = normalizeLocationName(cityName);
  if (!target) return null;
  return (
    provinces.find((province) => {
      const name = normalizeLocationName(province.name || '');
      const label = normalizeLocationName(province.label || '');
      return name === target || label === target || name.includes(target) || target.includes(name);
    }) ?? null
  );
}

function findWardMatch(wards: CreateMetadataWard[], provinceCode: string, wardName: string) {
  const target = normalizeLocationName(wardName);
  if (!target || !provinceCode) return null;
  return (
    wards.find((ward) => {
      if (!locationCodesEqual(ward.province_code, provinceCode)) return false;
      const name = normalizeLocationName(ward.name || '');
      const label = normalizeLocationName(ward.label || '');
      return name === target || label === target || name.includes(target) || target.includes(name);
    }) ?? null
  );
}

function buildAgentOrdererDefaults(
  user: MeResponse['data']['user'],
  agent: NonNullable<MeResponse['data']['agent']>,
  provinces: CreateMetadataProvince[],
  wards: CreateMetadataWard[],
) {
  const ordererName = (agent.business_name || user.name || '').trim();
  const ordererPhone = (user.phone || '').trim();
  const address = (agent.address || '').trim();

  let provinceCode = (agent.province_code || '').trim();
  let provinceLabel = '';
  let wardCode = (agent.ward_code || '').trim();
  let wardLabel = '';

  const matchedProvince =
    (provinceCode ? findProvinceByCode(provinces, provinceCode) : null) ??
    (agent.city ? findProvinceMatch(provinces, agent.city) : null);

  if (matchedProvince) {
    provinceCode = matchedProvince.code;
    provinceLabel = matchedProvince.name || matchedProvince.label;
  } else {
    provinceCode = '';
  }

  if (provinceCode) {
    const matchedWard =
      (wardCode ? findWardByCode(wards, provinceCode, wardCode) : null) ??
      (agent.ward ? findWardMatch(wards, provinceCode, agent.ward) : null);
    if (matchedWard) {
      wardCode = matchedWard.code;
      wardLabel = matchedWard.name || matchedWard.label;
    } else {
      wardCode = '';
    }
  }

  return { ordererName, ordererPhone, address, provinceCode, provinceLabel, wardCode, wardLabel };
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
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ clone_payload?: string | string[]; clone_source_order_no?: string | string[] }>();
  const insets = useSafeAreaInsets();

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
  const [previewSummary, setPreviewSummary] = useState<PreviewOrderSummary | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState('');
  const formScrollRef = useRef<ScrollView>(null);
  const fieldYMapRef = useRef<Record<string, number>>({});
  const previewRoundRef = useRef(0);
  const hasAppliedCloneRef = useRef(false);

  const cloneSourceOrderNo = useMemo(() => {
    const raw = Array.isArray(params.clone_source_order_no) ? params.clone_source_order_no[0] : params.clone_source_order_no;
    return (raw || '').trim();
  }, [params.clone_source_order_no]);

  const clonePayload = useMemo<CloneOrderTemplatePayload | null>(() => {
    const raw = Array.isArray(params.clone_payload) ? params.clone_payload[0] : params.clone_payload;
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as CloneOrderTemplatePayload;
      if (!parsed || !Array.isArray(parsed.products)) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [params.clone_payload]);

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

  function handleQuantityChange(value: string) {
    // Only allow digits for ordered quantity.
    setQuantity(value.replace(/\D/g, ''));
  }

  function handlePhoneChange(value: string, setter: (next: string) => void) {
    // Restrict phone inputs to digits only.
    setter(value.replace(/\D/g, ''));
  }

  function registerFieldLayout(key: string, y: number) {
    fieldYMapRef.current[key] = y;
  }

  function scrollToField(key: string) {
    const y = fieldYMapRef.current[key];
    if (typeof y !== 'number') return;
    formScrollRef.current?.scrollTo({ y: Math.max(y - 16, 0), animated: true });
  }

  function setFieldErrorAndScroll(errorKey: string, message: string, scrollKey?: string) {
    setFieldErrors({ [errorKey]: message });
    requestAnimationFrame(() => {
      scrollToField(scrollKey ?? errorKey);
    });
  }

  const quantityNumber = useMemo(() => {
    const qty = Number.parseInt(quantity.trim(), 10);
    return Number.isFinite(qty) && qty > 0 ? qty : 0;
  }, [quantity]);
  const selectedProductUnitPriceLabel = useMemo(
    () => formatProductUnitPriceLabel(selectedProduct, t('createOrder.noPrice')),
    [selectedProduct, t],
  );

  const previewVatRateLabel = useMemo(() => {
    const rate = previewSummary?.vat_rate_percent;
    if (rate == null || !Number.isFinite(rate)) return '0';
    return String(Number(rate.toFixed(2)));
  }, [previewSummary?.vat_rate_percent]);
  const previewHasDiscount = useMemo(() => {
    const raw = (previewSummary?.discount_amount ?? '').replace(/\./g, '').replace(',', '.').trim();
    if (!raw) return false;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0;
  }, [previewSummary?.discount_amount]);

  const resetForm = useCallback(() => {
    previewRoundRef.current += 1;
    setPreviewSummary(null);
    setPreviewLoading(false);
    setPreviewError('');
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
  }, []);

  const loadScreen = useCallback(async (options?: { prefillAgent?: boolean }) => {
    const prefillAgent = options?.prefillAgent ?? false;
    setBootLoading(true);
    setBootError('');
    try {
      const [metaRes, meRes] = await Promise.all([ordersService.fetchCreateMetadata(), authService.me()]);
      if (!metaRes.success) {
        setBootError(toUserFacingMessage(metaRes.message, t('createOrder.errors.loadMeta')));
        return;
      }
      if (!meRes.success || !meRes.data?.user?.id) {
        setBootError(toUserFacingMessage(meRes.message, t('createOrder.errors.loadSeller')));
        return;
      }
      const resolvedAgentProfileId =
        metaRes.data?.agent_profile_id ?? meRes.data?.agent?.agent_profile_id ?? null;
      if (!resolvedAgentProfileId) {
        setBootError(t('createOrder.errors.loadAgentProfile'));
        return;
      }
      setSellerUserId(meRes.data.user.id);
      setAgentProfileId(resolvedAgentProfileId);
      const loadedProducts = metaRes.data?.products ?? [];
      setProducts(loadedProducts);
      setProvinces(metaRes.data?.provinces ?? []);
      setWards(metaRes.data?.wards ?? []);

      if (!hasAppliedCloneRef.current && clonePayload) {
        const firstProduct = clonePayload.products[0];
        const matchedProduct = firstProduct
          ? (metaRes.data?.products ?? []).find((p) => p.id === firstProduct.product_id) ?? null
          : null;
        const province =
          findProvinceByCode(metaRes.data?.provinces ?? [], clonePayload.customer_province_code) ??
          (metaRes.data?.provinces ?? []).find((p) => p.code === clonePayload.customer_province_code);
        const ward =
          findWardByCode(
            metaRes.data?.wards ?? [],
            clonePayload.customer_province_code,
            clonePayload.customer_ward_code,
          ) ??
          (metaRes.data?.wards ?? []).find((w) => w.code === clonePayload.customer_ward_code);

        setSelectedProduct(matchedProduct);
        setQuantity(String(Math.max(1, Math.round(firstProduct?.quantity ?? 1))));
        setOrdererName(clonePayload.customer_name || '');
        setOrdererPhone(clonePayload.customer_phone || '');
        setIsSameRecipient(true);
        setProvinceCode(clonePayload.customer_province_code || '');
        setProvinceLabel(province?.name || province?.label || clonePayload.customer_province_code || '');
        setWardCode(clonePayload.customer_ward_code || '');
        setWardLabel(ward?.name || ward?.label || clonePayload.customer_ward_code || '');
        setAddress(clonePayload.customer_address || '');
        setFieldErrors({});

        hasAppliedCloneRef.current = true;
      } else if (loadedProducts.length === 1) {
        setSelectedProduct(loadedProducts[0]);
        setIsProductOpen(false);
      }

      if (prefillAgent && !clonePayload && meRes.data?.agent) {
        const defaults = buildAgentOrdererDefaults(
          meRes.data.user,
          meRes.data.agent,
          metaRes.data?.provinces ?? [],
          metaRes.data?.wards ?? [],
        );
        if (defaults.ordererName) setOrdererName(defaults.ordererName);
        if (defaults.ordererPhone) setOrdererPhone(defaults.ordererPhone);
        if (defaults.address) setAddress(defaults.address);
        if (defaults.provinceCode) {
          setProvinceCode(defaults.provinceCode);
          setProvinceLabel(defaults.provinceLabel);
        }
        if (defaults.wardCode) {
          setWardCode(defaults.wardCode);
          setWardLabel(defaults.wardLabel);
        }
      }
    } catch (e) {
      setBootError(toUserFacingMessage(e, t('createOrder.errors.loadMeta')));
    } finally {
      setBootLoading(false);
    }
  }, [clonePayload, t]);

  useFocusEffect(
    useCallback(() => {
      hasAppliedCloneRef.current = false;
      setSubmitting(false);
      resetForm();
      formScrollRef.current?.scrollTo({ y: 0, animated: false });
      void loadScreen({ prefillAgent: true });
    }, [loadScreen, resetForm]),
  );

  useRefetchOnReconnect(() => void loadScreen({ prefillAgent: false }));

  const isSingleProductCatalog = products.length === 1;
  const singleCatalogProduct = isSingleProductCatalog ? products[0] : null;

  useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;
    parent.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent.setOptions({ tabBarStyle: defaultTabBarStyle });
    };
  }, [navigation]);

  useEffect(() => {
    if (!selectedProduct || quantityNumber <= 0) {
      previewRoundRef.current += 1;
      setPreviewSummary(null);
      setPreviewLoading(false);
      setPreviewError('');
      return;
    }

    const round = ++previewRoundRef.current;
    const productId = selectedProduct.id;
    const qty = quantityNumber;

    setPreviewLoading(true);
    setPreviewError('');

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const res = await ordersService.previewOrder({
            order_channel: 'agent_order',
            products: [{ product_id: productId, quantity: qty }],
          });
          if (previewRoundRef.current !== round) return;
          if (res.success && res.data?.summary) {
            setPreviewSummary(res.data.summary);
            setPreviewError('');
          } else {
            setPreviewSummary(null);
            setPreviewError(toUserFacingMessage(res.message, t('createOrder.errors.previewFailed')));
          }
        } catch (e) {
          if (previewRoundRef.current !== round) return;
          setPreviewSummary(null);
          setPreviewError(toUserFacingMessage(e, t('createOrder.errors.previewFailed')));
        } finally {
          if (previewRoundRef.current === round) {
            setPreviewLoading(false);
          }
        }
      })();
    }, 250);

    return () => {
      clearTimeout(timer);
      previewRoundRef.current += 1;
      setPreviewLoading(false);
    };
  }, [selectedProduct, quantity, quantityNumber, t]);

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
      setFieldErrorAndScroll('__session', t('createOrder.validation.sellerRequired'), 'products');
      return;
    }
    if (!selectedProduct) {
      setFieldErrorAndScroll('products', t('createOrder.validation.productRequired'));
      return;
    }
    const qty = Number.parseInt(quantity.trim(), 10);
    if (!Number.isFinite(qty) || qty <= 0) {
      setFieldErrorAndScroll('products.0.quantity', t('createOrder.validation.quantityMin'));
      return;
    }
    if (!ordererName.trim()) {
      setFieldErrorAndScroll('customer_name', t('createOrder.validation.ordererNameRequired'));
      return;
    }
    if (ordererName.trim().length < 3) {
      setFieldErrorAndScroll('customer_name', t('createOrder.validation.ordererNameMinLength'));
      return;
    }
    if (!ordererPhone.trim()) {
      setFieldErrorAndScroll('customer_phone', t('createOrder.validation.ordererPhoneRequired'));
      return;
    }
    const ordererPhoneDigits = ordererPhone.replace(/\D/g, '');
    if (ordererPhoneDigits.length < 9) {
      setFieldErrorAndScroll('customer_phone', t('createOrder.validation.ordererPhoneDigits'));
      return;
    }
    if (!isSameRecipient) {
      if (!recipientName.trim()) {
        setFieldErrorAndScroll('recipient_name', t('createOrder.validation.recipientNameRequired'));
        return;
      }
      if (recipientName.trim().length < 3) {
        setFieldErrorAndScroll('recipient_name', t('createOrder.validation.recipientNameMinLength'));
        return;
      }
      if (!recipientPhone.trim()) {
        setFieldErrorAndScroll('recipient_phone', t('createOrder.validation.recipientPhoneRequired'));
        return;
      }
      const recipientPhoneDigits = recipientPhone.replace(/\D/g, '');
      if (recipientPhoneDigits.length < 9) {
        setFieldErrorAndScroll('recipient_phone', t('createOrder.validation.recipientPhoneDigits'));
        return;
      }
      if (!recipientProvinceCode) {
        setFieldErrorAndScroll('recipient_province_code', t('createOrder.validation.recipientProvinceRequired'));
        return;
      }
      if (!recipientWardCode) {
        setFieldErrorAndScroll('recipient_ward_code', t('createOrder.validation.recipientWardRequired'));
        return;
      }
      if (!recipientAddress.trim()) {
        setFieldErrorAndScroll('recipient_address', t('createOrder.validation.streetAddressRequired'));
        return;
      }
    }
    if (isSameRecipient && !provinceCode) {
      setFieldErrorAndScroll('customer_province_code', t('createOrder.validation.provinceRequired'));
      return;
    }
    if (isSameRecipient && !wardCode) {
      setFieldErrorAndScroll('customer_ward_code', t('createOrder.validation.wardRequired'));
      return;
    }
    if (isSameRecipient && !address.trim()) {
      setFieldErrorAndScroll('customer_address', t('createOrder.validation.streetAddressRequired'));
      return;
    }
    if (agentProfileId == null) {
      setFieldErrorAndScroll('__session', t('createOrder.validation.agentProfileRequired'), 'products');
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
      const shippingAddressLine = trimmedLine;
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
        Alert.alert(
          t('createOrder.errors.createFailed'),
          toUserFacingMessage(res.message, t('createOrder.errors.createFailed')),
        );
        return;
      }
      const orderNo = (res.data?.order_no ?? '').trim();
      const successBody =
        res.message ||
        (orderNo
          ? t('createOrder.alerts.successMessage', { orderNo })
          : t('createOrder.alerts.successMessageFallback'));
      Alert.alert(t('createOrder.alerts.successTitle'), successBody, [
        {
          text: t('createOrder.alerts.ok'),
          onPress: () => {
            resetForm();
            router.back();
          },
        },
      ]);
    } catch (e) {
      const fallbackMessage = toUserFacingMessage(e, t('createOrder.errors.createFailed'));
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
        requestAnimationFrame(() => {
          const firstKey = Object.keys(nextFieldErrors)[0];
          scrollToField(firstKey);
        });
      } else {
        Alert.alert(t('createOrder.errors.createFailed'), fallbackMessage);
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
              ref={formScrollRef}
              className="flex-1"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}>
              <View className="px-4 pt-4">
                {cloneSourceOrderNo ? (
                  <View className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
                    <Text className="text-xs text-emerald-700">Đang đặt lại từ đơn {cloneSourceOrderNo}</Text>
                  </View>
                ) : null}
                <View className="rounded-xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/5">
                  <View className="mb-4 flex-row items-center">
                    <MaterialCommunityIcons name="cube-outline" size={22} color="#16a34a" />
                    <Text className="ml-2 text-base font-semibold text-green-600">{t('createOrder.productInfo')}</Text>
                  </View>

                  <Text
                    className="mb-2 text-xs font-medium text-slate-600"
                    onLayout={(e) => registerFieldLayout('products', e.nativeEvent.layout.y)}>
                    {t('createOrder.selectProduct')}
                  </Text>
                  {isSingleProductCatalog && singleCatalogProduct ? (
                    <View className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3.5">
                      <Text className="text-base font-medium text-slate-900">{singleCatalogProduct.name}</Text>
                      <Text className="mt-1 text-sm text-slate-500">
                        {formatProductUnitPriceLabel(singleCatalogProduct, t('createOrder.noPrice'))}
                        {singleCatalogProduct.sale_unit
                          ? ` / ${localizeUnitDisplay(singleCatalogProduct.sale_unit)}`
                          : ''}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Pressable
                        className="mb-4 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3.5 active:bg-slate-50"
                        onPress={() => {
                          setIsProductOpen((prev) => !prev);
                          setIsProvinceOpen(false);
                          setIsWardOpen(false);
                        }}>
                        <Text className={`flex-1 pr-2 text-base ${selectedProduct ? 'text-slate-900' : 'text-slate-400'}`}>
                          {selectedProduct ? selectedProduct.name : t('createOrder.selectProductPlaceholder')}
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
                                  <Text className="mt-0.5 text-sm text-slate-500">
                                    {formatProductUnitPriceLabel(item, t('createOrder.noPrice'))}
                                    {item.sale_unit ? ` / ${localizeUnitDisplay(item.sale_unit)}` : ''}
                                  </Text>
                                </Pressable>
                              ))
                            )}
                          </ScrollView>
                        </View>
                      ) : null}
                    </>
                  )}

                  <Text
                    className="mb-2 text-xs font-medium text-slate-600"
                    onLayout={(e) => registerFieldLayout('products.0.quantity', e.nativeEvent.layout.y)}>
                    {t('createOrder.quantity')}
                  </Text>
                  <View
                    className={`flex-row items-center rounded-lg border border-slate-200 bg-white px-3 py-3.5 ${
                      pickFirstError(fieldErrors, 'products.0.quantity') ? 'mb-2' : 'mb-4'
                    }`}>
                    <TextInput
                      className="flex-1 text-base text-slate-900"
                      value={quantity}
                      onChangeText={handleQuantityChange}
                      keyboardType="number-pad"
                    />
                    <Text className="text-base text-slate-600">
                      {selectedProduct ? localizeUnitDisplay(selectedProduct.sale_unit ?? 'bar') : t('createOrder.unit')}
                    </Text>
                  </View>
                  <Text className={`text-xs text-slate-500 ${pickFirstError(fieldErrors, 'products.0.quantity') ? 'mb-2' : 'mb-4'}`}>
                    {t('createOrder.unitPrice')}: {selectedProductUnitPriceLabel}
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
                  <Text
                    className="mb-2 text-xs font-medium text-slate-600"
                    onLayout={(e) => registerFieldLayout('customer_name', e.nativeEvent.layout.y)}>
                    {t('createOrder.ordererName')}
                  </Text>
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

                  <Text
                    className="mb-2 text-xs font-medium text-slate-600"
                    onLayout={(e) => registerFieldLayout('customer_phone', e.nativeEvent.layout.y)}>
                    {t('createOrder.ordererPhone')}
                  </Text>
                  <TextInput
                    className={`rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-base text-slate-900 ${pickFirstError(fieldErrors, 'customer_phone') ? 'mb-2' : 'mb-4'}`}
                    placeholder={t('createOrder.phonePlaceholder')}
                    placeholderTextColor="#94a3b8"
                    value={ordererPhone}
                    onChangeText={(value) => handlePhoneChange(value, setOrdererPhone)}
                    keyboardType="phone-pad"
                  />
                  {pickFirstError(fieldErrors, 'customer_phone') ? (
                    <Text className="mb-4 text-xs text-red-600">{pickFirstError(fieldErrors, 'customer_phone')}</Text>
                  ) : null}



                  <Text
                    className="mb-2 text-xs font-medium text-slate-600"
                    onLayout={(e) => registerFieldLayout('customer_province_code', e.nativeEvent.layout.y)}>
                    {t('createOrder.province')}
                  </Text>
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

                  <Text
                    className="mb-2 text-xs font-medium text-slate-600"
                    onLayout={(e) => registerFieldLayout('customer_ward_code', e.nativeEvent.layout.y)}>
                    {t('createOrder.ward')}
                  </Text>
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

                  <Text
                    className="mb-2 text-xs font-medium text-slate-600"
                    onLayout={(e) => registerFieldLayout('customer_address', e.nativeEvent.layout.y)}>
                    {t('createOrder.streetAddress')}
                  </Text>
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
                    onPress={() => setIsSameRecipient((prev) => !prev)}>
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
                      <Text
                        className="mb-2 text-xs font-medium text-slate-600"
                        onLayout={(e) => registerFieldLayout('recipient_name', e.nativeEvent.layout.y)}>
                        {t('createOrder.recipientName')}
                      </Text>
                      <TextInput
                        className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-base text-slate-900"
                        placeholder={t('createOrder.recipientNamePlaceholder')}
                        placeholderTextColor="#94a3b8"
                        value={recipientName}
                        onChangeText={setRecipientName}
                      />
                      {pickFirstError(fieldErrors, 'recipient_name') ? (
                        <Text className="mb-4 text-xs text-red-600">{pickFirstError(fieldErrors, 'recipient_name')}</Text>
                      ) : null}

                      <Text
                        className="mb-2 text-xs font-medium text-slate-600"
                        onLayout={(e) => registerFieldLayout('recipient_phone', e.nativeEvent.layout.y)}>
                        {t('createOrder.recipientPhone')}
                      </Text>
                      <TextInput
                        className="mb-4 rounded-lg border border-slate-200 bg-white px-3 py-3.5 text-base text-slate-900"
                        placeholder={t('createOrder.recipientPhonePlaceholder')}
                        placeholderTextColor="#94a3b8"
                        value={recipientPhone}
                        onChangeText={(value) => handlePhoneChange(value, setRecipientPhone)}
                        keyboardType="phone-pad"
                      />
                      {pickFirstError(fieldErrors, 'recipient_phone') ? (
                        <Text className="mb-4 text-xs text-red-600">{pickFirstError(fieldErrors, 'recipient_phone')}</Text>
                      ) : null}

                      <Text
                        className="mb-2 text-xs font-medium text-slate-600"
                        onLayout={(e) => registerFieldLayout('recipient_province_code', e.nativeEvent.layout.y)}>
                        {t('createOrder.province')}
                      </Text>
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
                      {pickFirstError(fieldErrors, 'recipient_province_code') ? (
                        <Text className="mb-4 text-xs text-red-600">
                          {pickFirstError(fieldErrors, 'recipient_province_code')}
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

                      <Text
                        className="mb-2 text-xs font-medium text-slate-600"
                        onLayout={(e) => registerFieldLayout('recipient_ward_code', e.nativeEvent.layout.y)}>
                        {t('createOrder.ward')}
                      </Text>
                      <Pressable
                        className="mb-4 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3.5 active:bg-slate-50"
                        onPress={() => {
                          if (!recipientProvinceCode) {
                            setFieldErrors((prev) => ({
                              ...prev,
                              recipient_province_code: t('createOrder.validation.recipientProvinceBeforeWard'),
                            }));
                            return;
                          }
                          setFieldErrors((prev) => {
                            const next = { ...prev };
                            delete next.recipient_province_code;
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
                      {pickFirstError(fieldErrors, 'recipient_ward_code') ? (
                        <Text className="mb-4 text-xs text-red-600">{pickFirstError(fieldErrors, 'recipient_ward_code')}</Text>
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

                      <Text
                        className="mb-2 text-xs font-medium text-slate-600"
                        onLayout={(e) => registerFieldLayout('recipient_address', e.nativeEvent.layout.y)}>
                        {t('createOrder.streetAddress')}
                      </Text>
                      <TextInput
                        className={`min-h-[88px] rounded-lg border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 ${pickFirstError(fieldErrors, 'recipient_address') ? 'mb-2' : 'mb-4'}`}
                        multiline
                        placeholder={t('createOrder.streetAddressPlaceholder')}
                        placeholderTextColor="#94a3b8"
                        textAlignVertical="top"
                        value={recipientAddress}
                        onChangeText={setRecipientAddress}
                      />
                      {pickFirstError(fieldErrors, 'recipient_address') ? (
                        <Text className="mb-4 text-xs text-red-600">{pickFirstError(fieldErrors, 'recipient_address')}</Text>
                      ) : null}
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
                    <View className="flex-row items-center gap-2">
                      {previewLoading && !previewSummary ? (
                        <ActivityIndicator size="small" color="#16a34a" />
                      ) : null}
                      <Text className="text-base font-bold text-slate-900">
                        {previewSummary
                          ? appendCurrency(previewSummary.subtotal_amount, previewSummary.currency)
                          : previewLoading
                            ? t('createOrder.previewCalculating')
                            : t('createOrder.previewUnavailable')}
                      </Text>
                    </View>
                  </View>
                  {previewHasDiscount ? (
                    <View className="mt-1 flex-row items-center justify-between">
                      <Text className="text-base text-green-600">{t('createOrder.discount')}</Text>
                      <View className="flex-row items-center gap-2">
                        {previewLoading && !previewSummary ? (
                          <ActivityIndicator size="small" color="#64748b" />
                        ) : null}
                        <Text className="text-base text-green-600">
                          -{appendCurrency(previewSummary?.discount_amount, previewSummary?.currency)}
                        </Text>
                      </View>
                    </View>
                  ) : null}
                  {previewSummary ? (
                    <>
                      <View className="mt-1 flex-row items-center justify-between">
                        <Text className="text-base text-slate-700">{t('createOrder.vatBase')}</Text>
                        <Text className="text-base text-slate-800">
                          {appendCurrency(
                            previewSummary.vat_base ?? previewSummary.net_amount,
                            previewSummary.currency,
                          )}
                        </Text>
                      </View>
                      <View className="mt-1 flex-row items-center justify-between">
                        <Text className="text-base text-slate-700">
                          {t('createOrder.vatAmount', { rate: previewVatRateLabel })}
                        </Text>
                        <Text className="text-base text-slate-800">
                          {appendCurrency(previewSummary.vat_amount, previewSummary.currency)}
                        </Text>
                      </View>
                    </>
                  ) : null}
                  {previewError ? (
                    <Text className="mt-1 text-right text-xs text-red-600">{previewError}</Text>
                  ) : null}
                  <View className="mt-1 flex-row items-center justify-between border-t border-slate-100 pt-2">
                    <Text className="text-base font-bold text-slate-900">{t('createOrder.totalPayment')}</Text>
                    <View className="flex-row items-center gap-2">
                      {previewLoading && !previewSummary ? (
                        <ActivityIndicator size="small" color="#16a34a" />
                      ) : null}
                      <Text className="text-base font-bold text-green-600">
                        {previewSummary
                          ? appendCurrency(
                              previewSummary.total_with_vat ?? previewSummary.net_amount,
                              previewSummary.currency,
                            )
                          : previewLoading
                            ? t('createOrder.previewCalculating')
                            : t('createOrder.previewUnavailable')}
                      </Text>
                    </View>
                  </View>
                  {previewSummary?.currency?.trim() ? (
                    <Text className="mt-1 text-right text-xs text-slate-500">
                      {t('createOrder.currencyLabel', { code: previewSummary.currency.trim() })}
                    </Text>
                  ) : null}
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
