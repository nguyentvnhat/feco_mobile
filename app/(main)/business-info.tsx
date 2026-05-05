import { MaterialCommunityIcons } from '@expo/vector-icons';
import RenderHTML from 'react-native-render-html';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '@/src/lib/api';

type SettingsResponse = {
  success: boolean;
  message: string;
  data?: {
    settings?: {
      key: string;
      value: string | null;
    }[];
  };
};

const DEFAULT_BUSINESS_INFO = 'Nội dung đang cập nhật';

export default function BusinessInfoScreen() {
  const { width } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [businessInfo, setBusinessInfo] = useState('');
  const loadBusinessInfo = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<SettingsResponse>('/settings', { key: 'business_info' });
      if (!res.success) {
        setError(res.message || 'Không tải được thông tin doanh nghiệp.');
        setBusinessInfo('');
        return;
      }
      const value = res.data?.settings?.[0]?.value?.trim() || '';
      setBusinessInfo(value || DEFAULT_BUSINESS_INFO);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được thông tin doanh nghiệp.');
      setBusinessInfo('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBusinessInfo();
  }, [loadBusinessInfo]);

  const businessInfoHtml = useMemo(() => {
    const trimmed = businessInfo.trim();
    if (!trimmed) return `<p>${DEFAULT_BUSINESS_INFO}</p>`;
    if (trimmed.includes('<')) return trimmed;
    return `<p>${trimmed}</p>`;
  }, [businessInfo]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            onPress={() => router.replace('/(main)/account')}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#0f172a" />
          </Pressable>
          <Text style={styles.headerTitle}>Thông tin doanh nghiệp</Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {loading ? (
            <View style={styles.centeredBlock}>
              <ActivityIndicator size="small" color="#22c55e" />
            </View>
          ) : error ? (
            <View style={styles.errorBlock}>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
                onPress={() => void loadBusinessInfo()}>
                <Text style={styles.retryButtonText}>Tải lại</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.contentCard}>
              <RenderHTML
                contentWidth={Math.max(width - 96, 0)}
                source={{ html: businessInfoHtml }}
                baseStyle={styles.contentBase}
                tagsStyles={{
                  p: styles.contentParagraph,
                  h1: styles.contentH1,
                  h2: styles.contentH2,
                  h3: styles.contentH3,
                  li: styles.contentListItem,
                }}
              />
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 8,
    height: 40,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9999,
  },
  backButtonPressed: {
    backgroundColor: '#f1f5f9',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: '#0f172a',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  centeredBlock: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  errorBlock: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#dc2626',
  },
  retryButton: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonPressed: {
    backgroundColor: '#1e293b',
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  contentCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    padding: 24,
  },
  contentBase: {
    color: '#0f172a',
    fontSize: 16,
    lineHeight: 24,
  },
  contentParagraph: {
    marginTop: 0,
    marginBottom: 12,
  },
  contentH1: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 12,
  },
  contentH2: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  contentH3: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  contentListItem: {
    marginBottom: 6,
    color: '#0f172a',
  },
});
