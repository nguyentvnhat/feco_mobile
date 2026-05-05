import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useNetwork } from '@/hooks/use-network';

export function OfflineBanner() {
  const { t } = useTranslation();
  const { isOffline } = useNetwork();
  const insets = useSafeAreaInsets();

  if (!isOffline) {
    return null;
  }

  return (
    <View
      className="absolute left-0 right-0 bg-red-100 px-4"
      style={{ top: 0, zIndex: 9999, paddingTop: insets.top + 6, paddingBottom: 8 }}
      pointerEvents="none"
      accessibilityRole="alert"
      accessibilityLabel={t('network.offline')}>
      <Text className="text-center text-sm font-semibold text-red-700">{t('network.offline')}</Text>
    </View>
  );
}
