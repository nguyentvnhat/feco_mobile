import { Text, View } from 'react-native';

export function AgentsScreenHeader() {
  return (
    <View className="border-b border-slate-200 bg-white px-4 pb-4 pt-2">
      <Text className="text-2xl font-semibold tracking-tight text-slate-900">Đại lý</Text>
      <Text className="mt-1 text-sm text-slate-600">Mạng lưới đại lý cấp dưới</Text>
    </View>
  );
}
