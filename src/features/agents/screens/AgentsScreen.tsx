import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const tabs = ['Tất cả (24)', 'Đang hoạt động', 'Ngừng hoạt động'];

const dealers = [
  { id: '1', name: 'Đại lý Minh Chiến', location: 'Quận 1, TP. HCM', revenue: '45.000.000đ', orders: 12, stars: 2 },
  { id: '2', name: 'Đại lý Thu Hương', location: 'Quận 7, TP. HCM', revenue: '12.500.000đ', orders: 4, stars: 2 },
  { id: '3', name: 'Hùng Phát Mobile', location: 'Bình Thạnh, TP. HCM', revenue: '89.200.000đ', orders: 31, stars: 3 },
  { id: '4', name: 'Đại lý An Nhiên', location: 'Quận 3, TP. HCM', revenue: '32.150.000đ', orders: 19, stars: 3 },
];

export function AgentsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-4 py-3">
          <Text className="text-2xl font-semibold tracking-tight text-slate-900">Quản lý Đại lý</Text>
        </View>

        <View className="border-b border-slate-200 bg-white px-4 py-3">
          <View className="flex-row items-center rounded-xl bg-slate-100 px-3 py-3">
            <Feather name="search" size={20} color="#94a3b8" />
            <Text className="ml-2 text-base text-slate-400">Tìm kiếm theo tên hoặc khu vực...</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-3">
            <View className="flex-row gap-6">
              {tabs.map((tab, idx) => (
                <View key={tab} className="pb-2">
                  <Text className={`text-base font-semibold ${idx === 0 ? 'text-green-500' : 'text-slate-400'}`}>
                    {tab}
                  </Text>
                  {idx === 0 ? <View className="mt-2 h-0.5 rounded-full bg-green-500" /> : null}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-4 py-4 pb-8">
          {dealers.map((dealer) => (
            <View key={dealer.id} className="mb-4 rounded-2xl bg-white p-4 shadow-sm shadow-slate-900/5">
              <View className="flex-row items-start justify-between">
                <Text className="flex-1 text-base font-semibold text-slate-900">{dealer.name}</Text>
                <View className="ml-3 flex-row items-center">
                  {Array.from({ length: dealer.stars }).map((_, idx) => (
                    <Ionicons key={`${dealer.id}-star-${idx}`} name="star" size={18} color="#facc15" />
                  ))}
                </View>
              </View>

              <View className="mt-2 flex-row items-center">
                <Ionicons name="location-sharp" size={14} color="#64748b" />
                <Text className="ml-1 text-base text-slate-500">{dealer.location}</Text>
              </View>

              <View className="mt-3 flex-row items-center">
                <MaterialCommunityIcons name="cash-multiple" size={18} color="#22C55E" />
                <Text className="ml-1 text-base font-semibold text-green-500">{dealer.revenue}</Text>
              </View>

              <Text className="mt-2 text-base font-semibold text-slate-400">SỐ ĐƠN: {dealer.orders}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
