import React, { useState, useCallback } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import type { RootStackParamList } from '../navigation/AppNavigator';
import DatabaseService, { Product } from '../database/DatabaseService';
import { useTheme } from '../theme/ThemeContext';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;
type SortOption = 'category' | 'nameAsc' | 'nameDesc' | 'priceAsc' | 'priceDesc' | 'discount';

// Extend the Product interface to include missing properties
interface ExtendedProduct extends Product {
  description?: string;
  image?: string;
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    color: colors.text.primary,
  },
  sortButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 16,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    color: colors.text.secondary,
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  discountText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
  },
  sortOptionsContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    zIndex: 1000,
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sortOption: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sortOptionText: {
    marginLeft: 8,
    color: colors.text.primary,
  },
  sortOptionSelected: {
    backgroundColor: `${colors.primary}20`,
  },
  sortOptionSelectedText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
});

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('nameAsc');
  const [showSortOptions, setShowSortOptions] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const allProducts = await DatabaseService.getAllProducts();
      let sortedProducts = [...allProducts];

      switch (sortOption) {
        case 'nameAsc':
          sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
          break;
        case 'nameDesc':
          sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'priceAsc':
          sortedProducts.sort((a, b) => (a.price || 0) - (b.price || 0));
          break;
        case 'priceDesc':
          sortedProducts.sort((a, b) => (b.price || 0) - (a.price || 0));
          break;
        case 'discount':
          sortedProducts = sortedProducts.filter(p => p.discountPrice && p.discountPrice < p.price);
          break;
        case 'category':
          sortedProducts.sort((a, b) => a.category.localeCompare(b.category));
          break;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        sortedProducts = sortedProducts.filter(
          p =>
            p.name.toLowerCase().includes(query) ||
            (p.details || '').toLowerCase().includes(query) ||
            p.category.toLowerCase().includes(query)
        );
      }

      setProducts(sortedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortOption]);

  useFocusEffect(
    useCallback(() => {
      loadProducts();
    }, [loadProducts])
  );

  const handleAddPress = () => {
    navigation.navigate('AddItem');
  };

  const handleProductPress = (product: ExtendedProduct) => {
    if (product.id) {
      navigation.navigate('ProductDetail', { productId: product.id });
    } else {
      Alert.alert('Error', 'Product ID is missing');
    }
  };

  const renderProductItem = ({ item }: { item: ExtendedProduct }) => {
    // Calculate discount percentage if discount price exists
    const discountPercentage = item.discountPrice
      ? Math.round(((item.price - item.discountPrice) / item.price) * 100)
      : 0;
    const hasDiscount = item.discountPrice && item.discountPrice < item.price;

    return (
      <TouchableOpacity
        style={styles.productItem}
        onPress={() => handleProductPress(item)}
      >
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.productImage, { backgroundColor: colors.background }]}>
            <Icon name="image" size={30} color={colors.text.secondary} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.productCategory} numberOfLines={1}>
            {item.category}
          </Text>
          <View style={styles.priceContainer}>
            {hasDiscount ? (
              <>
                <Text style={styles.originalPrice}>₹{item.price?.toFixed(2)}</Text>
                <Text style={styles.price}>₹{item.discountPrice?.toFixed(2)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
                </View>
              </>
            ) : (
              <Text style={styles.price}>₹{item.price?.toFixed(2)}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="inventory" size={64} color={colors.text.secondary} />
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'No products found matching your search.'
          : 'No products added yet. Tap + to add your first item.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={colors.text.secondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <Icon name="sort" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {showSortOptions && (
        <View style={styles.sortOptionsContainer}>
          {[
            { value: 'nameAsc', label: 'Name (A-Z)', icon: 'sort-alphabetical-ascending' },
            { value: 'nameDesc', label: 'Name (Z-A)', icon: 'sort-alphabetical-descending' },
            { value: 'priceAsc', label: 'Price (Low to High)', icon: 'sort-numeric-ascending' },
            { value: 'priceDesc', label: 'Price (High to Low)', icon: 'sort-numeric-descending' },
            { value: 'discount', label: 'On Sale', icon: 'sale' },
            { value: 'category', label: 'Category', icon: 'category' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                sortOption === option.value && styles.sortOptionSelected,
              ]}
              onPress={() => {
                setSortOption(option.value as SortOption);
                setShowSortOptions(false);
              }}
            >
              <Icon
                name={option.icon as any}
                size={20}
                color={sortOption === option.value ? colors.primary : colors.text.primary}
              />
              <Text
                style={[
                  styles.sortOptionText,
                  sortOption === option.value && styles.sortOptionSelectedText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id?.toString() || `product-${item.name}-${item.price}`}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyComponent}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleAddPress}
      >
        <Icon name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default DashboardScreen;
