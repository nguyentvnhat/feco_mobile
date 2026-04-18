import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const rewards = [
  { id: '1', title: 'Đơn hàng #DH-2938', date: 'Hôm nay, 14:30', amount: '+2.079.000 đ', status: 'Thành công', state: 'success' as const },
  { id: '2', title: 'Thưởng KPI Tháng 5', date: '01/06/2024', amount: '+3.118.500 đ', status: 'Đã thanh toán', state: 'success' as const },
  { id: '3', title: 'Đơn hàng #DH-2910', date: '31/05/2024', amount: '+4.158.000 đ', status: 'Đang chờ', state: 'pending' as const },
  { id: '4', title: 'Đơn hàng #DH-2855', date: '30/05/2024', amount: '+2.079.000 đ', status: 'Thành công', state: 'success' as const },
  { id: '5', title: 'Đơn hàng #DH-2812', date: '29/05/2024', amount: '+3.118.500 đ', status: 'Thành công', state: 'success' as const },
  { id: '6', title: 'Đơn hàng #DH-2790', date: '28/05/2024', amount: '+4.158.000 đ', status: 'Thành công', state: 'success' as const },
  { id: '7', title: 'Đơn hàng #DH-2755', date: '27/05/2024', amount: '+2.079.000 đ', status: 'Thành công', state: 'success' as const },
  { id: '8', title: 'Đơn hàng #DH-2710', date: '26/05/2024', amount: '+3.118.500 đ', status: 'Thành công', state: 'success' as const },
  { id: '9', title: 'Đơn hàng #DH-2699', date: '25/05/2024', amount: '+4.158.000 đ', status: 'Thành công', state: 'success' as const },
  { id: '10', title: 'Đơn hàng #DH-2650', date: '24/05/2024', amount: '0 đ', status: 'Đã hủy', state: 'cancelled' as const },
  { id: '11', title: 'Thưởng Nhóm Tuần 3', date: '23/05/2024', amount: '+2.079.000 đ', status: 'Đã thanh toán', state: 'success' as const },
];

function stateStyle(state: 'success' | 'pending' | 'cancelled') {
  if (state === 'pending') {
    return {
      icon: 'clock-outline' as const,
      iconColor: '#F59E0B',
      iconBg: '#FFF7ED',
      amountColor: '#D97706',
      statusColor: '#D97706',
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
    statusColor: '#94A3B8',
  };
}

export default function CommissionHistoryScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-3">
          <Pressable
            className="mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
            onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#0f172a" />
          </Pressable>
          <Text className="text-2xl font-semibold tracking-tight text-slate-900">Hoa hồng của tôi</Text>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-6 pt-4">
          <Text className="mb-3 text-xl font-semibold text-slate-900">Lịch sử nhận thưởng</Text>

          {rewards.map((item) => {
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
                    <Text className="text-2xl font-semibold tracking-tight" style={{ color: style.amountColor }}>
                      {item.amount}
                    </Text>
                    <Text className="mt-0.5 text-sm font-medium" style={{ color: style.statusColor }}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
