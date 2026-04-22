import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BusinessInfoScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1">
        <View className="flex-row items-center border-b border-slate-200 bg-white px-3 py-3">
          <Pressable
            className="mr-2 h-10 w-10 items-center justify-center rounded-full active:bg-slate-100"
            onPress={() => router.back()}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#0f172a" />
          </Pressable>
          <Text className="text-2xl font-semibold tracking-tight text-slate-900">Thông tin doanh nghiệp</Text>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-6 py-8">
          <View className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5">
            <Text className="text-sm text-slate-600">
              Nhà nhập khẩu & phân phối độc quyền – Bảo hành chính hãng:
            </Text>
            <Text className="mt-3 text-base font-semibold text-slate-900">CÔNG TY TNHH DV PT THUẬN DƯƠNG</Text>

            <View className="mt-6 gap-4">
              <View>
                <Text className="text-xs font-medium uppercase tracking-wide text-slate-500">Địa chỉ</Text>
                <Text className="mt-1 text-base text-slate-900">
                  105 Nguyễn Hữu Tiến, Phường Tây Thạnh, TPHCM
                </Text>
              </View>

              <View>
                <Text className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</Text>
                <Text className="mt-1 text-base text-slate-900">fecox3@thuanduong.vn</Text>
              </View>

              <View>
                <Text className="text-xs font-medium uppercase tracking-wide text-slate-500">Hotline</Text>
                <Text className="mt-1 text-base text-slate-900">0921256565 (tư vấn FECO X3 cho Ô tô)</Text>
                <Text className="mt-1 text-base text-slate-900">0981879091 (tư vấn FECO X3 cho Xe máy)</Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
