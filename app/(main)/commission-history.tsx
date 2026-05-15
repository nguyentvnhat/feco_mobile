import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { appendCurrency, ordersService } from '@/src/features/orders';
import type { CommissionHistoryEntry, CommissionHistorySummary } from '@/src/features/orders';

type RewardRow = {
  id: string;
  title: string;
  date: string;
  amount: string;
  status: string;
  state: 'paid' | 'approved' | 'pending' | 'cancelled';
};

type MonthOption = {
  value: string;
  label: string;
};

const MONTH_FILTER_COUNT = 12;

function getCurrentPeriodMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function buildMonthOptions(count: number): MonthOption[] {
  const options: MonthOption[] = [];
  const anchor = new Date();

  for (let i = 0; i < count; i += 1) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const value = `${year}-${month}`;
    options.push({
      value,
      label: i === 0 ? 'Tháng này' : `Tháng ${Number(month)}/${year}`,
    });
  }

  return options;
}

function formatEntryDate(iso: string | null) {
  if (!iso) return '--';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '--';
  const datePart = d.toLocaleDateString('vi-VN');
  const timePart = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  return `${datePart} ${timePart}`;
}

function formatPeriodMonth(periodMonth: string | null | undefined) {
  const raw = (periodMonth ?? '').trim();
  const match = /^(\d{4})-(\d{2})$/.exec(raw);
  if (!match) return raw || '--';
  return `Tháng ${Number(match[2])}/${match[1]}`;
}

function formatCommissionAmount(amount: string, settlementStatus: string) {
  const formatted = appendCurrency(amount, 'đ');
  if (formatted === '--') return '--';
  if (settlementStatus === 'rejected') return formatted;
  return formatted.startsWith('+') || formatted.startsWith('-') ? formatted : `+${formatted}`;
}

function normalizeState(settlementStatus: string): RewardRow['state'] {
  if (settlementStatus === 'rejected') return 'cancelled';
  if (settlementStatus === 'pending') return 'pending';
  if (settlementStatus === 'approved') return 'approved';
  return 'paid';
}

function stateStyle(state: RewardRow['state']) {
  if (state === 'pending') {
    return {
      icon: 'clock-outline' as const,
      iconColor: '#F59E0B',
      iconBg: '#FFF7ED',
      amountColor: '#D97706',
      statusColor: '#D97706',
    };
  }
  if (state === 'approved') {
    return {
      icon: 'check-circle-outline' as const,
      iconColor: '#3B82F6',
      iconBg: '#EFF6FF',
      amountColor: '#2563EB',
      statusColor: '#2563EB',
    };
  }
  if (state === 'cancelled') {
    return {
      icon: 'close-circle-outline' as const,
      iconColor: '#EF4444',
      iconBg: '#FEF2F2',
      amountColor: '#EF4444',
      statusColor: '#EF4444',
    };
  }
  return {
    icon: 'cash-multiple' as const,
    iconColor: '#22C55E',
    iconBg: '#ECFDF5',
    amountColor: '#22C55E',
    statusColor: '#16A34A',
  };
}

function mapEntryToRow(entry: CommissionHistoryEntry): RewardRow {
  const orderNo = entry.order_no?.trim() ?? '';
  const code = orderNo
    ? orderNo.startsWith('#')
      ? orderNo
      : `#${orderNo}`
    : entry.order_id
      ? `#${entry.order_id}`
      : '#—';

  return {
    id: String(entry.id),
    title: `Đơn hàng ${code}`,
    date: formatEntryDate(entry.created_at),
    amount: formatCommissionAmount(entry.amount, entry.settlement_status),
    status: entry.settlement_status_label_vi || entry.settlement_status,
    state: normalizeState(entry.settlement_status),
  };
}

export default function CommissionHistoryScreen() {
  const params = useLocalSearchParams<{ source?: string | string[] }>();
  const monthOptions = useMemo(() => buildMonthOptions(MONTH_FILTER_COUNT), []);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentPeriodMonth);
  const [isMonthOpen, setIsMonthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodMonth, setPeriodMonth] = useState('');
  const [summary, setSummary] = useState<CommissionHistorySummary | null>(null);
  const [rows, setRows] = useState<RewardRow[]>([]);
  const source = Array.isArray(params.source) ? params.source[0] : params.source;

  const selectedMonthLabel = useMemo(() => {
    const found = monthOptions.find((item) => item.value === selectedMonth);
    return found?.label ?? formatPeriodMonth(selectedMonth);
  }, [monthOptions, selectedMonth]);

  function handleBack() {
    if (source === 'home') {
      router.replace('/(main)');
      return;
    }
    if (source === 'account') {
      router.replace('/(main)/account');
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(main)/account');
  }

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError('');
      setIsMonthOpen(false);
      try {
        const res = await ordersService.historyCommission({ month: selectedMonth });
        if (cancelled) return;
        if (!res.success) {
          setError(res.message || 'Không tải được lịch sử hoa hồng.');
          setPeriodMonth('');
          setSummary(null);
          setRows([]);
          return;
        }

        setPeriodMonth(res.data?.period_month ?? selectedMonth);
        setSummary(res.data?.summary ?? null);
        setRows((res.data?.entries ?? []).map(mapEntryToRow));
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Không tải được lịch sử hoa hồng.');
          setPeriodMonth('');
          setSummary(null);
          setRows([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHistory();
    return () => {
      cancelled = true;
    };
  }, [selectedMonth]);

  function pickMonth(value: string) {
    setSelectedMonth(value);
    setIsMonthOpen(false);
  }

  const periodLabel = useMemo(() => formatPeriodMonth(periodMonth), [periodMonth]);
  const summaryBreakdown = useMemo(
    () =>
      summary
        ? [
            { key: 'pending', label: 'Chờ duyệt', value: summary.pending_commission },
            { key: 'approved', label: 'Đã duyệt', value: summary.approved_commission },
            { key: 'paid', label: 'Đã thanh toán', value: summary.paid_commission },
          ]
        : [],
    [summary],
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-3">
          <Pressable
            className="mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
            onPress={handleBack}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#0f172a" />
          </Pressable>
          <Text className="text-2xl font-semibold tracking-tight text-slate-900">Hoa hồng của tôi</Text>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6 pt-4">
          <Text className="mb-2 text-xs font-medium text-slate-600">Chọn tháng</Text>
          <Pressable
            className="mb-4 flex-row items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-3.5 active:bg-slate-50"
            onPress={() => setIsMonthOpen((prev) => !prev)}>
            <Text className="flex-1 pr-2 text-base font-medium text-slate-900">{selectedMonthLabel}</Text>
            <MaterialCommunityIcons
              name={isMonthOpen ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#64748b"
            />
          </Pressable>
          {isMonthOpen ? (
            <View className="mb-4 max-h-52 rounded-lg border border-slate-200 bg-white shadow-sm shadow-slate-900/5">
              <ScrollView nestedScrollEnabled>
                {monthOptions.map((item) => {
                  const isSelected = item.value === selectedMonth;
                  return (
                    <Pressable
                      key={item.value}
                      className={`flex-row items-center justify-between border-b border-slate-100 px-3 py-3 active:bg-slate-50 ${isSelected ? 'bg-green-50' : ''}`}
                      onPress={() => pickMonth(item.value)}>
                      <Text
                        className={`text-base ${isSelected ? 'font-semibold text-green-700' : 'text-slate-900'}`}>
                        {item.label}
                      </Text>
                      {isSelected ? (
                        <MaterialCommunityIcons name="check" size={20} color="#16a34a" />
                      ) : null}
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {loading ? (
            <View className="items-center py-10">
              <ActivityIndicator size="small" color="#22c55e" />
            </View>
          ) : error ? (
            <Text className="text-center text-sm text-red-600">{error}</Text>
          ) : (
            <>
              <View className="mb-4 rounded-xl bg-white p-4 shadow-sm shadow-slate-900/5">
                <Text className="text-sm text-slate-500">{periodLabel}</Text>
                <Text className="mt-1 text-base font-semibold text-slate-900">Tổng hoa hồng</Text>
                <Text className="mt-1 text-2xl font-bold text-green-600">
                  {appendCurrency(summary?.total_commission, 'đ')}
                </Text>
                {/* {summary != null ? (
                  <Text className="mt-1 text-sm text-slate-500">
                    {summary.entry_count} khoản hoa hồng
                  </Text>
                ) : null}
                {summaryBreakdown.length > 0 ? (
                  <View className="mt-4 border-t border-slate-100 pt-3">
                    {summaryBreakdown.map((item) => (
                      <View key={item.key} className="mb-2 flex-row items-center justify-between last:mb-0">
                        <Text className="text-sm text-slate-600">{item.label}</Text>
                        <Text className="text-sm font-semibold text-slate-800">
                          {appendCurrency(item.value, 'đ')}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null} */}
              </View>

              <Text className="mb-3 text-base font-semibold text-slate-900">Lịch sử nhận thưởng</Text>

              {rows.length === 0 ? (
                <View className="items-center py-10">
                  <View className="h-28 w-28 items-center justify-center rounded-full bg-green-50">
                    <MaterialCommunityIcons name="cash-multiple" size={42} color="#22c55e" />
                  </View>
                  <Text className="mt-3 text-center text-sm text-slate-500">Hiện chưa có lịch sử hoa hồng.</Text>
                </View>
              ) : (
                rows.map((item) => {
                  const style = stateStyle(item.state);
                  return (
                    <View key={item.id} className="mb-3 rounded-xl bg-white px-3 py-3 shadow-sm shadow-slate-900/5">
                      <View className="flex-row items-center">
                        <View
                          className="h-12 w-12 items-center justify-center rounded-full"
                          style={{ backgroundColor: style.iconBg }}>
                          <MaterialCommunityIcons name={style.icon} size={22} color={style.iconColor} />
                        </View>

                        <View className="ml-3 flex-1">
                          <Text className="text-base font-semibold text-slate-800">{item.title}</Text>
                          <Text className="mt-0.5 text-sm text-slate-400">{item.date}</Text>
                        </View>

                        <View className="items-end">
                          <Text className="text-base font-semibold" style={{ color: style.amountColor }}>
                            {item.amount}
                          </Text>
                          <Text className="mt-0.5 text-sm font-medium" style={{ color: style.statusColor }}>
                            {item.status}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
