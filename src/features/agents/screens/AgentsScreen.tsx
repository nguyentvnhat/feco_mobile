import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AgentRowCard } from '../components/AgentRowCard';
import { AgentsScreenHeader } from '../components/AgentsScreenHeader';
import { MOCK_AGENTS } from '../data';

export function AgentsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
      <AgentsScreenHeader />
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-3 px-4 py-4 pb-8">
          {MOCK_AGENTS.map((item) => (
            <View key={item.id}>
              <AgentRowCard item={item} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
