import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authService } from '@/src/features/auth/auth.service';

const menuItems = [
  { key: 'commission-history', label: 'Lịch sử hoa hồng' },
  { key: 'business-info', label: 'Thông tin doanh nghiệp' },
  { key: 'commission-policy', label: 'Chính sách hoa hồng' },
];

export default function AccountRoute() {
  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [name, setName] = useState('FECO X3');
  const [roleText, setRoleText] = useState('Đại lý chính thức');
  const [agentCode, setAgentCode] = useState('---');
  const [phone, setPhone] = useState('---');
  const [email, setEmail] = useState('---');
  const [address, setAddress] = useState('---');

  useEffect(() => {
    let mounted = true;
    async function loadMe() {
      try {
        const response = await authService.me();
        if (!mounted || !response.success) return;
        const user = response.data?.user;
        const agent = response.data?.agent;
        setName(agent?.business_name || user?.name || 'FECO X3');
        setRoleText(agent?.name ? `Đại lý ${agent.name}` : 'Đại lý chính thức');
        setAgentCode(agent?.code || (agent?.id ? `ID-${agent.id}` : '---'));
        setPhone(user?.phone || '---');
        setEmail(user?.email || '---');
        setAddress(agent?.full_address || '---');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void loadMe();
    return () => {
      mounted = false;
    };
  }, []);

  const displayName = useMemo(() => name || 'FECO X3', [name]);

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      const result = await authService.logout();
      if (!result.success) {
        Alert.alert('Đăng xuất thất bại', result.message || 'Vui lòng thử lại.');
        return;
      }
      router.replace('/auth/login');
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
      <ScrollView className="flex-1" contentContainerClassName="px-4 pb-8">
        <Text className="py-4 text-2xl font-semibold tracking-tight text-slate-900">Hồ sơ cá nhân</Text>

        <View className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-900/5">
          <View className="items-center">
            <View className="h-20 w-20 items-center justify-center rounded-2xl border border-green-100 bg-white shadow-sm">
              <MaterialCommunityIcons name="fire-circle" size={34} color="#22c55e" />
              <Text className="mt-1 text-[10px] font-semibold text-green-600">FECO X3</Text>
            </View>
            <Text className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{displayName}</Text>
            <Text className="mt-1 text-sm font-medium text-slate-500">{roleText}</Text>
          </View>

          <View className="mt-6 flex-row border-t border-slate-100 pt-4">
            <View className="flex-1 items-center border-r border-slate-100">
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-300">CẤP BẬC</Text>
              <Text className="mt-1 text-base font-semibold text-slate-800">Đại lý Cấp 1</Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-300">MÃ ĐẠI LÝ</Text>
              <Text className="mt-1 text-base font-semibold text-slate-800">{agentCode}</Text>
            </View>
          </View>
        </View>

        <View className="mt-4 rounded-xl border border-slate-100 bg-white shadow-sm shadow-slate-900/5">
          <Text className="px-5 py-4 text-xl font-semibold text-slate-900">Thông tin liên hệ</Text>

          <View className="flex-row items-center border-t border-slate-100 px-5 py-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-green-50">
              <Feather name="phone" size={18} color="#22c55e" />
            </View>
            <View className="ml-3">
              <Text className="text-sm text-slate-400">Số điện thoại</Text>
              <Text className="text-base font-semibold text-slate-800">{phone}</Text>
            </View>
          </View>

          <View className="flex-row items-center border-t border-slate-100 px-5 py-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-green-50">
              <Feather name="mail" size={18} color="#22c55e" />
            </View>
            <View className="ml-3">
              <Text className="text-sm text-slate-400">Email</Text>
              <Text className="text-base font-semibold text-slate-800">{email}</Text>
            </View>
          </View>

          <View className="flex-row items-center border-t border-slate-100 px-5 py-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-green-50">
              <Ionicons name="location-outline" size={20} color="#22c55e" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm text-slate-400">Địa chỉ</Text>
              <Text className="text-base font-semibold text-slate-800">{address}</Text>
            </View>
          </View>
        </View>

        <View className="mt-4 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm shadow-slate-900/5">
          {menuItems.map((item, idx) => (
            <Pressable
              key={item.key}
              className={`flex-row items-center justify-between px-5 py-4 ${
                idx === 0 ? '' : 'border-t border-slate-100'
              }`}
              onPress={() => {
                if (item.key === 'commission-history') {
                  router.push({
                    pathname: '/(main)/commission-history',
                    params: { source: 'account' },
                  });
                  return;
                }
                if (item.key === 'business-info') {
                  router.push('/(main)/business-info');
                  return;
                }
                if (item.key === 'commission-policy') {
                  router.push('/(main)/commission-policy');
                }
              }}>
              <Text className="text-base font-semibold text-slate-800">{item.label}</Text>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </Pressable>
          ))}
        </View>

        <Pressable
          className={`mt-6 flex-row items-center justify-center rounded-xl border py-4 ${
            logoutLoading ? 'border-slate-300 bg-slate-100' : 'border-green-100 bg-green-50 active:bg-green-100'
          }`}
          disabled={logoutLoading}
          onPress={handleLogout}>
          {logoutLoading ? (
            <ActivityIndicator color="#64748b" />
          ) : (
            <>
              <MaterialCommunityIcons name="logout" size={20} color="#22c55e" />
              <Text className="ml-2 text-base font-semibold text-green-500">Đăng xuất</Text>
            </>
          )}
        </Pressable>

        {loading ? <Text className="mt-3 text-center text-xs text-slate-400">Đang tải thông tin...</Text> : null}
        <Text className="mt-5 text-center text-sm font-semibold text-slate-300">Phiên bản 2.4.0 (Build 102)</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
