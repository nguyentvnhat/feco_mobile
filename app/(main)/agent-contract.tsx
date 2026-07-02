import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

function buildPdfViewerUrl(fileUrl: string, session: number): string {
  const trimmed = fileUrl.trim();
  if (Platform.OS === 'android' && /^https?:\/\//i.test(trimmed)) {
    return `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(trimmed)}`;
  }

  const separator = trimmed.includes('?') ? '&' : '?';
  return `${trimmed}${separator}_v=${session}`;
}

export default function AgentContractScreen() {
  const params = useLocalSearchParams<{
    url?: string | string[];
    title?: string | string[];
    returnTo?: string | string[];
  }>();
  const rawUrl = Array.isArray(params.url) ? params.url[0] : params.url;
  const rawTitle = Array.isArray(params.title) ? params.title[0] : params.title;
  const rawReturnTo = Array.isArray(params.returnTo) ? params.returnTo[0] : params.returnTo;
  const title = (rawTitle || 'Hợp đồng đại lý').trim();
  const fileUrl = (rawUrl || '').trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewerSession, setViewerSession] = useState(0);

  const viewerUrl = useMemo(
    () => (fileUrl ? buildPdfViewerUrl(fileUrl, viewerSession) : ''),
    [fileUrl, viewerSession],
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setError('');
      setViewerSession((current) => current + 1);
    }, [fileUrl]),
  );

  const handleGoBack = useCallback(() => {
    if (rawReturnTo === 'account') {
      router.replace('/(main)/account');
      return;
    }
    router.back();
  }, [rawReturnTo]);

  const handleRetry = useCallback(() => {
    setError('');
    setLoading(true);
    setViewerSession((current) => current + 1);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            onPress={handleGoBack}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#0f172a" />
          </Pressable>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {!fileUrl ? (
          <View style={styles.centeredBlock}>
            <MaterialCommunityIcons name="file-alert-outline" size={48} color="#94a3b8" />
            <Text style={styles.errorText}>Không có đường dẫn hợp đồng.</Text>
            <Pressable
              style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
              onPress={handleGoBack}>
              <Text style={styles.retryButtonText}>Quay lại</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.viewerWrap}>
            {loading ? (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.loadingText}>Đang tải hợp đồng...</Text>
              </View>
            ) : null}

            {error ? (
              <View style={styles.errorOverlay}>
                <Text style={styles.errorText}>{error}</Text>
                <Pressable
                  style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
                  onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>Tải lại</Text>
                </Pressable>
              </View>
            ) : null}

            {viewerUrl ? (
              <WebView
                key={`${viewerUrl}-${viewerSession}`}
                source={{ uri: viewerUrl }}
                style={styles.webview}
                originWhitelist={['*']}
                cacheEnabled={false}
                incognito={Platform.OS === 'android'}
                startInLoadingState
                onLoadStart={() => {
                  setLoading(true);
                  setError('');
                }}
                onLoadEnd={() => setLoading(false)}
                onError={() => {
                  setLoading(false);
                  setError('Không thể hiển thị hợp đồng. Vui lòng thử lại.');
                }}
                onHttpError={(event) => {
                  if (event.nativeEvent.statusCode >= 400) {
                    setLoading(false);
                    setError('Không thể tải file hợp đồng từ máy chủ.');
                  }
                }}
              />
            ) : null}
          </View>
        )}
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
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.4,
    color: '#0f172a',
  },
  viewerWrap: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  webview: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
  },
  centeredBlock: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 12,
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
});
