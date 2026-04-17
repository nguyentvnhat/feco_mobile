import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProductRowCard } from '../components/ProductRowCard';
import { ProductsScreenHeader } from '../components/ProductsScreenHeader';
import { MOCK_PRODUCTS } from '../data';

export function ProductsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-100" edges={['top']}>
      <ProductsScreenHeader />
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="gap-3 px-4 py-4 pb-8">
          {MOCK_PRODUCTS.map((item) => (
            <View key={item.id}>
              <ProductRowCard item={item} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
