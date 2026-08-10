# feco_mobile — Improvement Plan

> Ngày lập: 2026-07-06  
> Người review: Senior Engineer  
> Mục tiêu: Cải thiện chất lượng codebase theo từng giai đoạn, ưu tiên impact vs effort

---

## Mức độ ưu tiên

| Ký hiệu | Ý nghĩa |
|---|---|
| 🔴 P0 | Bug / rủi ro production — sửa ngay |
| 🟠 P1 | Tech debt ảnh hưởng tốc độ phát triển |
| 🟡 P2 | Code quality & maintainability |
| 🟢 P3 | Nice-to-have |

---

## Phase 1 — Quick Wins
**Thời gian ước tính: 1–2 ngày**  
Sửa nhanh, không break gì, impact ngay lập tức.

---

### 🔴 P0 · Fix Tailwind content paths

**Vấn đề:**  
`tailwind.config.js` không scan `src/` → NativeWind classes trong `src/features/**` có thể bị purge ở production build → UI vỡ layout.

**Hiện tại:**
```js
content: [
  './app/**/*.{js,jsx,ts,tsx}',
  './components/**/*.{js,jsx,ts,tsx}',
],
```

**Sửa thành:**
```js
content: [
  './app/**/*.{js,jsx,ts,tsx}',
  './components/**/*.{js,jsx,ts,tsx}',
  './src/**/*.{js,jsx,ts,tsx}',  // ← thêm dòng này
],
```

**File:** `tailwind.config.js`

---

### 🔴 P0 · Dọn boilerplate Expo template

**Vấn đề:**  
`/components/` chứa code mặc định từ `expo create-app` (ThemedText, ThemedView, HelloWave, ParallaxScrollView...), không được dùng trong app thực. Gây confusion cho developer mới.

**Hành động:**
- Xóa toàn bộ `/components/` (hoặc giữ lại nếu có plan dùng sau)
- Các components thực tế của project đặt trong `src/components/`

**Files cần xóa:**
```
components/external-link.tsx
components/haptic-tab.tsx
components/hello-wave.tsx
components/parallax-scroll-view.tsx
components/themed-text.tsx
components/themed-view.tsx
components/ui/
```

---

### 🟠 P1 · Fix i18n inconsistency

**Vấn đề 1:** `account.tsx` hardcode toàn bộ tiếng Việt trong khi các màn hình khác (Login, Orders, CreateOrder) đã dùng `useTranslation()`.

**Hành động:** Thêm keys vào `src/locales/vi.json` và replace strings trong `account.tsx`:
```json
"account": {
  "title": "Hồ sơ cá nhân",
  "contractCode": "MÃ HỢP ĐỒNG",
  "agentCode": "MÃ ĐẠI LÝ",
  "contactInfo": "Thông tin liên hệ",
  "phone": "Số điện thoại",
  "email": "Thư điện tử",
  "address": "Địa chỉ",
  "logout": "Đăng xuất",
  "menu": {
    "commissionHistory": "Lịch sử hoa hồng",
    "discountHistory": "Lịch sử chiết khấu",
    "businessInfo": "Thông tin doanh nghiệp",
    "commissionPolicy": "Chính sách hoa hồng"
  }
}
```

**Vấn đề 2:** `i18n.js` khai báo `en` bundle nhưng `supportedLngs: ['vi']` — bundle được load vào memory mà không bao giờ dùng được.

**Sửa:** Xóa `en` bundle hoặc bật support đúng cách:
```js
// Option A — chỉ dùng vi
supportedLngs: ['vi'],
// Xóa: en: { translation: en }

// Option B — nếu có plan support English
supportedLngs: ['vi', 'en'],
```

---

### 🟠 P1 · Fix menuItems routing trong account.tsx

**Vấn đề:** Navigation dùng `if-else` chaining, không scale khi thêm menu item mới.

**Hiện tại:**
```tsx
if (item.key === 'commission-history') {
  router.push({ pathname: '/(main)/commission-history', params: { source: 'account' } });
  return;
}
if (item.key === 'discount-history') { ... }
// ...
```

**Sửa thành data-driven:**
```tsx
const menuItems = [
  {
    key: 'commission-history',
    label: t('account.menu.commissionHistory'),
    href: '/(main)/commission-history' as const,
    params: { source: 'account' },
  },
  {
    key: 'discount-history',
    label: t('account.menu.discountHistory'),
    href: '/(main)/discount-history' as const,
    params: { source: 'account' },
  },
  {
    key: 'business-info',
    label: t('account.menu.businessInfo'),
    href: '/(main)/business-info' as const,
  },
  {
    key: 'commission-policy',
    label: t('account.menu.commissionPolicy'),
    href: '/(main)/commission-policy' as const,
  },
];

// onPress
onPress={() => router.push({ pathname: item.href, params: item.params })}
```

---

### 🟡 P2 · Dọn feature stubs rỗng

**Vấn đề:** `src/features/reports/` và `app/(main)/reports/` hoàn toàn trống, gây impression feature đã có nhưng thực ra chưa.

**Hành động:**
- Xóa folder nếu chưa có plan implement gần
- Hoặc thêm `TODO.md` trong folder với scope + timeline dự kiến

---

## Phase 2 — Architecture Improvements
**Thời gian ước tính: 3–5 ngày**  
Giảm duplicate, tăng reliability.

---

### 🟠 P1 · Cache `/me` response — tránh double-fetch

**Vấn đề:**  
`authService.me()` được gọi 2 lần độc lập khi vào app:
1. `AuthContext` — gọi lại khi `onConnectionRestored`
2. `TabLayout.loadMe()` — để lấy `canAccessAgents` và `showWelcomeModal`

→ 2 network requests cho cùng endpoint ngay khi mount.

**Giải pháp:** Extend `AuthContext` để hold `meData`:

```tsx
// src/features/auth/AuthContext.tsx

type MeData = MeResponse['data'] | null;

type AuthContextValue = {
  token: string | null;
  isLoading: boolean;
  meData: MeData;                   // ← thêm
  refreshMe: () => Promise<void>;   // ← thêm
  setSession: (access: string, refresh?: string | null) => Promise<void>;
  logout: () => Promise<void>;
};
```

`TabLayout` chỉ đọc từ context, không fetch riêng:
```tsx
// app/(main)/_layout.tsx
const { meData, token, isLoading } = useAuth();
const canAccessAgents = meData?.agent?.has_agent_children === true;
const showWelcomeModal = meData?.agent?.requires_mobile_welcome === true;
```

**Lợi ích:**
- `/me` chỉ gọi 1 lần khi vào app
- Data nhất quán trên mọi màn hình (account, tabs, create-order)
- `create-order.tsx` cũng có thể dùng `meData` thay vì fetch riêng

---

### 🟠 P1 · Thêm Error Boundaries

**Vấn đề:** Không có error boundary nào → uncaught render error = app crash hoàn toàn.

**Cấu trúc đề xuất:**
```
app/_layout.tsx          ← RootErrorBoundary (wrap toàn app)
app/(main)/_layout.tsx   ← MainErrorBoundary (catch tab crashes)
```

**Implementation:**
```tsx
// src/components/error-boundary.tsx
import React from 'react';
import { View, Text, Pressable } from 'react-native';

type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-base font-semibold text-slate-900">Đã xảy ra lỗi</Text>
          <Text className="mt-2 text-sm text-slate-500">{this.state.error?.message}</Text>
          <Pressable
            className="mt-6 rounded-lg bg-green-500 px-6 py-3"
            onPress={() => {
              this.setState({ hasError: false, error: null });
              this.props.onReset?.();
            }}>
            <Text className="font-semibold text-white">Thử lại</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
```

---

### 🟡 P2 · Server-side filter cho Orders status tabs

**Vấn đề:**  
Orders screen filter client-side sau khi fetch. Tab "processing" chỉ hiện orders trong trang đã load, không phải toàn bộ. Khi load more, filter không trigger refetch server.

**Option A — Server-side filter (khuyến nghị nếu backend support):**
```ts
// orders.service.ts
listMine(params?: { limit?: number; page?: number; status?: string }) {
  return api.get<ListOrdersApiResponse>('/orders', params);
}
```

```tsx
// orders.tsx — reload khi đổi tab
const handleTabChange = useCallback((tabKey: string) => {
  setActiveTab(tabKey);
  void reloadOrders(tabKey); // pass status vào fetch
}, []);
```

**Option B — Giữ nguyên, document limitation:**  
Thêm note UI: _"Hiển thị theo trang hiện tại"_ nếu không đổi được backend.

---

## Phase 3 — Refactor create-order.tsx
**Thời gian ước tính: 3–4 ngày**  
File hiện tại 1279+ dòng với 30+ `useState`. Tách thành hooks và components nhỏ.

---

### 🟠 P1 · Tách logic thành custom hooks

**Cấu trúc đề xuất:**

```
src/features/orders/
  hooks/
    useOrderBootstrap.ts      ← load metadata + me, prefill agent defaults
    useLocationPicker.ts      ← province/ward state + picker open/close logic
    useOrderPreview.ts        ← debounced preview API call
    useClonePayload.ts        ← parse URL params + apply clone template
    useOrderForm.ts           ← form state + validation + submit
  components/
    ProductPicker.tsx         ← dropdown chọn sản phẩm
    LocationPicker.tsx        ← reusable cho orderer + recipient address
    OrderPreviewSummary.tsx   ← hiển thị subtotal, VAT, discount
    RecipientToggle.tsx       ← switch "giao cho người khác"
```

**`useOrderBootstrap` interface:**
```ts
function useOrderBootstrap(clonePayload: CloneOrderTemplatePayload | null) {
  return {
    loading: boolean;
    error: string;
    products: CreateMetadataProduct[];
    provinces: CreateMetadataProvince[];
    wards: CreateMetadataWard[];
    sellerUserId: number | null;
    agentProfileId: number | null;
    agentDefaults: AgentOrdererDefaults | null;
    reload: (opts?: { prefillAgent?: boolean }) => Promise<void>;
  };
}
```

**`useOrderPreview` interface:**
```ts
function useOrderPreview(
  productId: number | null,
  quantity: number,
) {
  return {
    summary: PreviewOrderSummary | null;
    loading: boolean;
    error: string;
  };
}
```

**Kết quả sau refactor — CreateOrderScreen chỉ còn ~150 dòng:**
```tsx
export default function CreateOrderScreen() {
  const { t } = useTranslation();
  const bootstrap = useOrderBootstrap(clonePayload);
  const form = useOrderForm(bootstrap);
  const preview = useOrderPreview(form.selectedProduct?.id ?? null, form.quantityNumber);

  if (bootstrap.loading) return <BootLoadingView />;
  if (bootstrap.error) return <BootErrorView error={bootstrap.error} onRetry={bootstrap.reload} />;

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'bottom']}>
      <CreateOrderHeader onBack={form.handleBack} />
      <ScrollView ref={form.scrollRef}>
        <ProductPicker {...form.productPickerProps} products={bootstrap.products} />
        <LocationPicker label={t('createOrder.orderer')} {...form.ordererLocationProps} />
        <RecipientToggle
          isSame={form.isSameRecipient}
          onToggle={form.setIsSameRecipient}
          recipientProps={form.recipientLocationProps}
        />
        <OrderPreviewSummary preview={preview} />
        <SubmitButton onPress={form.handleSubmit} loading={form.submitting} />
      </ScrollView>
    </SafeAreaView>
  );
}
```

---

## Phase 4 — Testing Foundation
**Thời gian ước tính: ongoing (thêm dần)**  
Bắt đầu nhỏ với pure functions, tăng dần coverage theo feature mới.

---

### 🟡 P2 · Setup Jest + test coverage ban đầu

**Setup:** Jest đã có sẵn qua `babel-jest` trong devDependencies. Chỉ cần thêm config:

```json
// package.json
"jest": {
  "preset": "jest-expo",
  "testMatch": ["**/__tests__/**/*.test.(ts|tsx)", "**/src/**/*.test.(ts|tsx)"]
}
```

**Ưu tiên test theo business impact:**

| File | Loại test | Lý do |
|---|---|---|
| `src/features/orders/orderStatus.ts` | Unit | Pure function, switch logic — dễ break |
| `src/lib/user-facing-error.ts` | Unit | Error message mapping — ảnh hưởng toàn app |
| `src/lib/session-hydration.ts` | Unit | Async gate — race condition nếu sai |
| Location utils trong create-order | Unit | Fuzzy matching — dễ regression |
| `authService.login()` | Integration | Mock axios, test token extraction logic |
| `useOrderForm` (sau Phase 3) | Hook test | Validation rules |

**Ví dụ test đơn giản để bắt đầu:**
```ts
// src/features/orders/__tests__/orderStatus.test.ts
import { getOrderStatusPresentation } from '../orderStatus';

describe('getOrderStatusPresentation', () => {
  it('trả về màu xanh lá cho delivered', () => {
    const result = getOrderStatusPresentation('delivered', 'Đã giao');
    expect(result.textColor).toBe('#22C55E');
    expect(result.label).toBe('Đã giao');
  });

  it('trả về màu đỏ cho cancelled', () => {
    const result = getOrderStatusPresentation('cancelled', 'Đã hủy');
    expect(result.textColor).toBe('#EF4444');
  });

  it('trả về fallback label từ orderLabelStatus', () => {
    const result = getOrderStatusPresentation('unknown_status', 'Trạng thái lạ');
    expect(result.label).toBe('Trạng thái lạ');
  });
});
```

---

## Phase 5 — Developer Experience
**Thời gian ước tính: 1–2 ngày**

---

### 🟡 P2 · Chuẩn hóa import paths

**Vấn đề:** Hiện mix `@/src/...` và `@/hooks/...`, không nhất quán.

**Đề xuất thêm path aliases:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"],
      "@features/*": ["./src/features/*"],
      "@lib/*": ["./src/lib/*"],
      "@hooks/*": ["./hooks/*"],
      "@components/*": ["./src/components/*"],
      "@theme/*": ["./src/theme/*"]
    }
  }
}
```

```ts
// Trước
import { authService } from '@/src/features/auth/auth.service';
import { toUserFacingMessage } from '@/src/lib/user-facing-error';

// Sau
import { authService } from '@features/auth/auth.service';
import { toUserFacingMessage } from '@lib/user-facing-error';
```

> **Lưu ý:** Cần cập nhật cả `babel.config.js` với `babel-plugin-module-resolver` nếu dùng alias mới.

---

### 🟢 P3 · Steering file cho conventions

Tạo `.kiro/steering/mobile-conventions.md` để document cho team:

```md
## Cấu trúc feature mới
## Pattern: service → hook → screen
## Loading/error state conventions
## i18n key naming (feature.section.key)
## NativeWind class ordering (layout → spacing → color → typography)
```

---

### 🟢 P3 · Kiểm tra `.env.example`

Đảm bảo `.env.example` có đủ tất cả keys cần thiết với comment giải thích:
```env
# URL backend API (không có trailing slash)
EXPO_PUBLIC_API_BASE_URL=https://api.example.com
```

---

## Roadmap tổng hợp

```
Tuần 1
├── Phase 1: Quick Wins              (ngày 1–2)
│   ├── ✅ Fix tailwind content paths
│   ├── ✅ Xóa boilerplate components
│   ├── ✅ Fix i18n account.tsx + i18n.js
│   └── ✅ Data-driven menuItems
│
└── Phase 2: Architecture            (ngày 3–5)
    ├── Cache /me → AuthContext
    ├── Error Boundaries
    └── Orders server-side filter (nếu backend ready)

Tuần 2–3
├── Phase 3: Refactor create-order
└── Phase 5: DX improvements

Ongoing
└── Phase 4: Testing — thêm dần mỗi khi viết feature/fix bug mới
```

---

## Checklist theo dõi

### Phase 1
- [ ] Fix `tailwind.config.js` content paths
- [ ] Xóa boilerplate `/components/`
- [ ] i18n: thêm keys cho `account.tsx`
- [ ] i18n: đồng nhất `supportedLngs` trong `i18n.js`
- [ ] Data-driven `menuItems` trong `account.tsx`
- [ ] Xóa / document `src/features/reports/` rỗng

### Phase 2
- [ ] Thêm `meData` + `refreshMe` vào `AuthContext`
- [ ] Migrate `TabLayout` dùng `meData` từ context
- [ ] Tạo `ErrorBoundary` component
- [ ] Wrap `RootLayout` và `TabLayout` với error boundary
- [ ] Quyết định approach filter orders (client vs server)

### Phase 3
- [ ] Tạo `useOrderBootstrap`
- [ ] Tạo `useLocationPicker`
- [ ] Tạo `useOrderPreview`
- [ ] Tạo `useClonePayload`
- [ ] Tạo `useOrderForm`
- [ ] Tạo `ProductPicker` component
- [ ] Tạo `LocationPicker` component
- [ ] Tạo `OrderPreviewSummary` component
- [ ] Refactor `create-order.tsx` dùng hooks mới

### Phase 4
- [ ] Setup Jest config
- [ ] Test `orderStatus.ts`
- [ ] Test `user-facing-error.ts`
- [ ] Test `session-hydration.ts`
- [ ] Test location utils
- [ ] Test `authService.login()`

### Phase 5
- [ ] Cập nhật `tsconfig.json` path aliases
- [ ] Cập nhật `babel.config.js` nếu cần
- [ ] Tạo `.kiro/steering/mobile-conventions.md`
- [ ] Review và update `.env.example`
