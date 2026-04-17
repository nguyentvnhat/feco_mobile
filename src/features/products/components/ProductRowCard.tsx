import { Text, View } from 'react-native';

export type ProductRow = {
  id: string;
  name: string;
  sku: string;
  price: string;
  unit: string;
};

type Props = {
  item: ProductRow;
};

export function ProductRowCard({ item }: Props) {
  return (
    <View className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5">
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1">
          <Text className="text-base font-semibold text-slate-900">{item.name}</Text>
          <Text className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">{item.sku}</Text>
        </View>
        <View className="items-end">
          <Text className="text-base font-semibold text-green-600">{item.price}</Text>
          <Text className="mt-1 text-sm text-slate-500">{item.unit}</Text>
        </View>
      </View>
    </View>
  );
}
