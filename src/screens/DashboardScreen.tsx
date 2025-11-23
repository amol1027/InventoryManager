import React, { useState, useCallback, useLayoutEffect } from 'react';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
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
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import type { RootStackParamList } from '../navigation/AppNavigator';
import DatabaseService, { Product } from '../database/DatabaseService';
import { useTheme } from '../theme/ThemeContext';
import ProductCard from '../components/ProductCard';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;
type SortOption = 'category' | 'nameAsc' | 'nameDesc' | 'priceAsc' | 'priceDesc' | 'discount';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    color: colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100, // Space for FAB
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
    marginTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  sortOptionsContainer: {
    position: 'absolute',
    top: 70,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Glassmorphism base
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    padding: 8,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  sortOption: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
  },
  sortOptionText: {
    marginLeft: 12,
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  sortOptionSelected: {
    backgroundColor: colors.primary + '15', // 15% opacity
  },
  sortOptionSelectedText: {
    color: colors.primary,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
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

  // Configure native header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Dashboard',
      headerStyle: {
        backgroundColor: colors.surface,
      },
      headerTintColor: colors.text.primary,
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: 20,
      },
      headerShadowVisible: false, // Remove default shadow for cleaner look
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            try {
              navigation.dispatch(DrawerActions.toggleDrawer());
            } catch (error) {
              console.error('Error toggling drawer:', error);
            }
          }}
          style={{ paddingHorizontal: 16 }}
        >
          <Icon name="menu" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setShowSortOptions((prev) => !prev);
          }}
          style={{ paddingHorizontal: 16 }}
        >
          <Icon name="sort" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors]);

  const loadProducts = useCallback(async () => {
    try {
      // Don't set loading to true on every sort to prevent flash
      if (products.length === 0) setLoading(true);

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

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setProducts(sortedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortOption, products.length]);

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

  const renderProductItem = ({ item, index }: { item: ExtendedProduct; index: number }) => {
    return (
      <ProductCard
        product={item}
        onPress={handleProductPress}
        index={index}
      />
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Icon name="inventory" size={80} color={colors.text.disabled} />
      <Text style={styles.emptyText}>
        {searchQuery
          ? 'No products found matching your search.'
          : 'No products added yet.\nTap the + button to add your first item.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={colors.text.disabled}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {showSortOptions && (
        <View style={styles.sortOptionsContainer}>
          {[
            { value: 'nameAsc', label: 'Name (A-Z)', icon: 'sort-by-alpha' },
            { value: 'nameDesc', label: 'Name (Z-A)', icon: 'sort-by-alpha' },
            { value: 'priceAsc', label: 'Price (Low to High)', icon: 'trending-up' },
            { value: 'priceDesc', label: 'Price (High to Low)', icon: 'trending-down' },
            { value: 'discount', label: 'On Sale', icon: 'local-offer' },
            { value: 'category', label: 'Category', icon: 'category' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.sortOption,
                sortOption === option.value && styles.sortOptionSelected,
              ]}
              onPress={() => {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setSortOption(option.value as SortOption);
                setShowSortOptions(false);
              }}
            >
              <Icon
                name={option.icon as any}
                size={20}
                color={sortOption === option.value ? colors.primary : colors.text.secondary}
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
          showsVerticalScrollIndicator={false}
        />
      )}

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleAddPress}
        activeOpacity={0.8}
      >
        <Icon name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default DashboardScreen;