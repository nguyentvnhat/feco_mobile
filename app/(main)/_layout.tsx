import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {
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
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size ?? 24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Đơn hàng',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inventory-2" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: 'Đại lý',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size ?? 24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size ?? 24} color={color} />
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
    </Tabs>
  );
}
