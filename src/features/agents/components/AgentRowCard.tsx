import { Text, View } from 'react-native';

export type AgentRow = {
  id: string;
  businessName: string;
  area: string;
  status: string;
  statusColor: string;
  statusBg: string;
};

type Props = {
  item: AgentRow;
};

export function AgentRowCard({ item }: Props) {
  return (
    <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-base font-semibold text-slate-900">{item.businessName}</Text>
          <Text className="mt-1 text-sm text-slate-600">{item.area}</Text>
        </View>
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: item.statusBg }}>
          <Text className="text-xs font-semibold" style={{ color: item.statusColor }}>
            {item.status}
          </Text>
        </View>
      </View>
    </View>
  );
}
