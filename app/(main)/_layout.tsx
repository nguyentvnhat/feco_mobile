import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { Redirect, Tabs, router } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { AgentWelcomeModal } from '@/src/components/agent-welcome-modal';
import { useRefetchOnReconnect } from '@/hooks/use-network';
import { authService } from '@/src/features/auth/auth.service';
import { useAuth } from '@/src/features/auth';
import { toUserFacingMessage } from '@/src/lib/user-facing-error';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const { token, isLoading } = useAuth();
  const insets = useSafeAreaInsets();
  const [canAccessAgents, setCanAccessAgents] = useState<boolean | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeSubmitting, setWelcomeSubmitting] = useState(false);

  const loadMe = useCallback(async () => {
    if (!token) {
      setCanAccessAgents(null);
      setShowWelcomeModal(false);
      return;
    }
    try {
      const res = await authService.me();
      const showAgentsTab = res.data?.agent?.has_agent_children === true;
      setCanAccessAgents(showAgentsTab);
      setShowWelcomeModal(res.data?.agent?.requires_mobile_welcome === true);
    } catch {
      setCanAccessAgents(false);
      setShowWelcomeModal(false);
    }
  }, [token]);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  useRefetchOnReconnect(loadMe);

  async function handleWelcomeConfirm() {
    if (welcomeSubmitting) return;

    setWelcomeSubmitting(true);
    try {
      const res = await authService.acknowledgeMobileWelcome();
      if (!res.success) {
        Alert.alert('Không thể tiếp tục', toUserFacingMessage(res.message, 'Vui lòng thử lại.'));
        return;
      }
      setShowWelcomeModal(false);
      router.replace('/(main)/account');
    } catch (error) {
      Alert.alert('Không thể tiếp tục', toUserFacingMessage(error, 'Vui lòng thử lại.'));
    } finally {
      setWelcomeSubmitting(false);
    }
  }

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
    <>
      <Tabs
        tabBar={(props) => {
          const currentRouteName = props.state.routes[props.state.index]?.name;
          const parentTabByHiddenRoute: Record<string, string> = {
            'create-order': 'orders',
            'order-detail': 'orders',
            'agent-orders': 'agents',
            'commission-history': 'account',
            'discount-history': 'account',
            'business-info': 'account',
            'commission-policy': 'account',
            'agent-contract': 'account',
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
            paddingBottom: 8 + insets.bottom,
            height: 68 + insets.bottom,
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
          name="agent-orders"
          options={{
            href: null,
            title: 'Đơn hàng đại lý',
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
            title: 'Lịch sử hoa hồng',
          }}
        />
        <Tabs.Screen
          name="discount-history"
          options={{
            href: null,
            title: 'Lịch sử chiết khấu',
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
        <Tabs.Screen
          name="agent-contract"
          options={{
            href: null,
            title: 'Hợp đồng đại lý',
          }}
        />
      </Tabs>

      <AgentWelcomeModal
        visible={showWelcomeModal}
        loading={welcomeSubmitting}
        onConfirm={() => void handleWelcomeConfirm()}
      />
    </>
  );
}
