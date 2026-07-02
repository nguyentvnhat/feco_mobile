import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';

type AgentWelcomeModalProps = {
  visible: boolean;
  loading?: boolean;
  onConfirm: () => void;
};

export function AgentWelcomeModal({ visible, loading = false, onConfirm }: AgentWelcomeModalProps) {
  const { t } = useTranslation();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View className="flex-1 items-center justify-center bg-black/45 px-6">
        <View className="w-full max-w-md rounded-2xl bg-white p-6 shadow-lg">
          <View className="mb-4 items-center">
            <View className="h-14 w-14 items-center justify-center rounded-full bg-green-50">
              <MaterialCommunityIcons name="clipboard-check-outline" size={30} color="#22c55e" />
            </View>
          </View>

          <Text className="text-center text-xl font-semibold text-slate-900">
            {t('welcome.title')}
          </Text>
          <Text className="mt-3 text-center text-base leading-6 text-slate-600">
            {t('welcome.message')}
          </Text>

          <Pressable
            className={`mt-6 items-center rounded-xl bg-green-500 px-4 py-3.5 ${
              loading ? 'opacity-70' : 'active:bg-green-600'
            }`}
            disabled={loading}
            onPress={onConfirm}>
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-semibold text-white">{t('welcome.confirm')}</Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
