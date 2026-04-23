import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import React from 'react';

import { useAuth } from '@/src/features/auth';

export default function TabLayout() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }
  if (!token) {
    return <Redirect href="/auth/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#E2E8F0',
          backgroundColor: '#FFFFFF',
          paddingTop: 8,
          paddingBottom: 8,
          height: 68,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color }) => <Feather name="home" size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="inventory-2" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: 'Đại lý',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle-outline" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-order"
        options={{
          href: null,
          title: 'Tạo đơn',
        }}
      />
      <Tabs.Screen
        name="order-detail"
        options={{
          href: null,
          title: 'Chi tiết đơn hàng',
        }}
      />
      <Tabs.Screen
        name="commission-history"
        options={{
          href: null,
          title: 'Hoa hồng của tôi',
        }}
      />
      <Tabs.Screen
        name="business-info"
        options={{
          href: null,
          title: 'Thông tin doanh nghiệp',
        }}
      />
      <Tabs.Screen
        name="commission-policy"
        options={{
          href: null,
          title: 'Chính sách hoa hồng',
        }}
      />
    </Tabs>
  );
}
