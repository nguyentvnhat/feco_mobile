import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { Redirect, Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { authService } from '@/src/features/auth/auth.service';
import { useAuth } from '@/src/features/auth';

export default function TabLayout() {
  const { token, isLoading } = useAuth();
  const [canAccessAgents, setCanAccessAgents] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      if (!token) {
        setCanAccessAgents(null);
        return;
      }
      try {
        const res = await authService.me();
        if (cancelled) return;
        const agentTypeCode = (res.data?.agent?.agent_type?.code ?? '').trim().toLowerCase();
        setCanAccessAgents(agentTypeCode !== 'distributor');
      } catch {
        if (!cancelled) {
          setCanAccessAgents(true);
        }
      }
    }

    void loadMe();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (isLoading) {
    return null;
  }
  if (!token) {
    return <Redirect href="/auth/login" />;
  }
  if (canAccessAgents === null) {
    return null;
  }

  return (
    <Tabs
      tabBar={(props) => {
        const currentRouteName = props.state.routes[props.state.index]?.name;
        const parentTabByHiddenRoute: Record<string, string> = {
          'create-order': 'orders',
          'order-detail': 'orders',
          'commission-history': 'account',
          'business-info': 'account',
          'commission-policy': 'account',
        };
        const parentTabName = currentRouteName ? parentTabByHiddenRoute[currentRouteName] : undefined;

        if (!parentTabName) {
          return <BottomTabBar {...props} />;
        }

        const parentTabIndex = props.state.routes.findIndex((route) => route.name === parentTabName);
        if (parentTabIndex < 0) {
          return <BottomTabBar {...props} />;
        }

        return <BottomTabBar {...props} state={{ ...props.state, index: parentTabIndex }} />;
      }}
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
          href: canAccessAgents ? undefined : null,
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
