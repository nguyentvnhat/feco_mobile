import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const timeline = [
  { id: '1', title: 'Đang giao hàng', time: '25/10/2023 - 09:00', active: true },
  { id: '2', title: 'Đã xuất kho', time: '24/10/2023 - 17:00', active: false },
  { id: '3', title: 'Đơn hàng đã xác nhận', time: '24/10/2023 - 14:45', active: false },
];

const products = [
  { id: '1', name: 'Giảm khí thải ô tô', qty: 'x 1 thanh', amount: '4.158.000đ' },
  { id: '2', name: 'Giảm khí thải xe máy', qty: 'x 1 thanh', amount: '1.782.000đ' },
];

export default function OrderDetailScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-3">
          <Pressable
            className="mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
            onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#0f172a" />
          </Pressable>
          <Text className="text-2xl font-semibold tracking-tight text-slate-900">Chi Tiết Đơn Hàng</Text>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 pb-24 pt-4">
          <View className="rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">Mã đơn hàng</Text>
            <Text className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">#ORD-20231024-001</Text>

            <View className="mt-3 flex-row items-center justify-between">
              <View className="rounded-full bg-green-50 px-3 py-1.5">
                <Text className="text-sm font-semibold text-green-500">Đã xuất hóa đơn</Text>
              </View>
              <View className="rounded-full bg-green-50 px-3 py-1.5">
                <Text className="text-sm font-semibold text-green-500">Đang giao</Text>
              </View>
            </View>

            <View className="mt-4 flex-row border-t border-slate-100 pt-3">
              <View className="flex-1">
                <Text className="text-sm text-slate-400">Ngày đặt</Text>
                <Text className="text-base font-semibold text-slate-900">24/10/2023 14:30</Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm text-slate-400">Thanh toán</Text>
                <Text className="text-base font-semibold text-slate-900">Chuyển khoản</Text>
              </View>
            </View>
          </View>

          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <Text className="text-xl font-semibold text-slate-900">TRẠNG THÁI VẬN CHUYỂN</Text>
            <View className="mt-3">
              {timeline.map((step, idx) => (
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
                    {idx < timeline.length - 1 ? <View className="h-9 w-0.5 bg-slate-200" /> : null}
                  </View>
                  <View className="pb-3">
                    <Text className={`text-base font-semibold ${step.active ? 'text-slate-900' : 'text-slate-300'}`}>
                      {step.title}
                    </Text>
                    <Text className={`text-sm ${step.active ? 'text-slate-500' : 'text-slate-300'}`}>{step.time}</Text>
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
            <Text className="text-base font-semibold text-slate-900">Garage Ô tô Minh Sang - Trung tâm Chăm sóc Xe</Text>
            <Text className="mt-1 text-base font-semibold text-slate-400">0901 234 567</Text>
            <Text className="mt-1 text-base font-semibold text-slate-400">123 Đường Lê Lợi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh</Text>
          </View>

          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <Text className="text-xl font-semibold text-slate-900">DANH SÁCH SẢN PHẨM</Text>
            <View className="mt-3">
              {products.map((item) => (
                <View key={item.id} className="mb-3 flex-row items-center rounded-xl bg-slate-50 px-3 py-3">
                  <View className="h-12 w-12 items-center justify-center rounded-md bg-white">
                    <MaterialCommunityIcons name="package-variant-closed" size={24} color="#1e293b" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-base font-semibold text-slate-800">{item.name}</Text>
                    <Text className="text-sm text-slate-400">{item.qty}</Text>
                  </View>
                  <Text className="text-2xl font-semibold tracking-tight text-slate-900">{item.amount}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="mt-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
            <View className="flex-row items-center justify-between">
              <Text className="text-base text-slate-400">Tổng tiền hàng</Text>
              <Text className="text-2xl font-semibold tracking-tight text-slate-900">5.940.000đ</Text>
            </View>
            <View className="mt-1 flex-row items-center justify-between">
              <Text className="text-base text-green-500">Chiết khấu</Text>
              <Text className="text-2xl font-semibold tracking-tight text-green-500">-100.000đ</Text>
            </View>
            <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3">
              <Text className="text-xl font-semibold text-slate-900">Tổng thanh toán</Text>
              <Text className="text-3xl font-bold text-green-500">5.840.000đ</Text>
            </View>
          </View>
        </ScrollView>

        <View className="border-t border-slate-200 bg-white px-4 py-3">
          <View className="flex-row gap-3">
            <Pressable className="flex-1 items-center justify-center rounded-xl border border-slate-200 py-3.5 active:bg-slate-50">
              <Text className="text-base font-semibold text-slate-700">Liên Hệ Hỗ Trợ</Text>
            </Pressable>
            <Pressable className="flex-1 flex-row items-center justify-center rounded-xl bg-green-500 py-3.5 active:bg-green-600">
              <Feather name="file-text" size={18} color="#fff" />
              <Text className="ml-2 text-base font-semibold text-white">Xem hóa đơn</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
