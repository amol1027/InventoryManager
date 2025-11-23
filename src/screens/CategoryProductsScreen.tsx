import React, { useState, useMemo, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Image,
  RefreshControl,
  Dimensions,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { RootStackParamList, RootDrawerParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Reanimated, { FadeInDown, Layout } from 'react-native-reanimated';

import DatabaseService, { Product } from '../database/DatabaseService';
import { useTheme } from '../theme/ThemeContext';
import { calculateFinalPrice, formatPrice } from '../utils/PriceCalculator';
import ProductCard from '../components/ProductCard';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CategoryProductsScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<RootStackParamList, 'CategoryProducts'>,
  DrawerNavigationProp<RootDrawerParamList>
>;
type CategoryProductsScreenRouteProp = RouteProp<RootStackParamList, 'CategoryProducts'>;

const CategoryProductsScreen = () => {
  const navigation = useNavigation<CategoryProductsScreenNavigationProp>();
  const route = useRoute<CategoryProductsScreenRouteProp>();
  const { categoryName } = route.params;
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'quantity'>('name');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      await DatabaseService.initDatabase();
      const fetchedProducts = await DatabaseService.getProductsByCategory(categoryName);
      setProducts(fetchedProducts);
      setFilteredProducts(fetchedProducts);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryName]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
  }, [loadProducts]);

  const filterAndSortProducts = useCallback(() => {
    let result = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.price - b.price;
        case 'quantity':
          return (a.quantity || 0) - (b.quantity || 0);
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilteredProducts(result);
  }, [products, searchQuery, sortBy]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    filterAndSortProducts();
  }, [filterAndSortProducts]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: categoryName,
      headerStyle: {
        backgroundColor: colors.surface,
      },
      headerTintColor: colors.text.primary,
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: 20,
      },
      headerShadowVisible: false,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            if (route.params.from === 'Categories') {
              navigation.navigate('Categories');
            } else {
              navigation.goBack();
            }
          }}
          style={{ paddingRight: 16 }}
        >
          <Icon name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setShowFilters(!showFilters);
          }}
          style={{ padding: 8 }}
        >
          <Icon name="filter-list" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, categoryName, colors, showFilters, route.params.from]);

  const renderItem = ({ item, index }: { item: Product; index: number }) => {
    const isGrid = viewMode === 'grid';

    if (!isGrid) {
      return (
        <ProductCard
          product={item}
          onPress={(product) => navigation.navigate('ProductDetail', { productId: product.id! })}
          index={index}
        />
      );
    }

    // Grid View Item
    const priceCalculation = calculateFinalPrice(item.price, item.discountPrice, item.gstSlab || 0);
    return (
      <Reanimated.View
        entering={FadeInDown.delay(index * 50).springify()}
        layout={Layout.springify()}
        style={[styles.productCard, styles.gridItem]}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={() => navigation.navigate('ProductDetail', { productId: item.id! })}
        >
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} style={styles.gridImage} />
          ) : (
            <View style={[styles.gridImage, styles.placeholderImage]}>
              <Icon name="image" size={24} color={colors.text.disabled} />
            </View>
          )}

          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

            <View style={styles.priceContainer}>
              <Text style={styles.price}>{formatPrice(priceCalculation.finalPrice)}</Text>
              {item.discountPrice && (
                <Text style={styles.originalPrice}>{formatPrice(item.price)}</Text>
              )}
            </View>

            <View style={styles.stockContainer}>
              <Icon
                name={item.quantity && item.quantity > 0 ? "check-circle" : "error"}
                size={14}
                color={item.quantity && item.quantity > 0 ? colors.success : colors.error}
              />
              <Text style={[
                styles.stockText,
                { color: item.quantity && item.quantity > 0 ? colors.success : colors.error }
              ]}>
                {item.quantity && item.quantity > 0 ? `${item.quantity} in stock` : 'Out of stock'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Reanimated.View>
    );
  };

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

      {showFilters && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'name' && styles.activeFilter]}
              onPress={() => setSortBy('name')}
            >
              <Text style={[styles.filterText, sortBy === 'name' && styles.activeFilterText]}>Name</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'price' && styles.activeFilter]}
              onPress={() => setSortBy('price')}
            >
              <Text style={[styles.filterText, sortBy === 'price' && styles.activeFilterText]}>Price</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, sortBy === 'quantity' && styles.activeFilter]}
              onPress={() => setSortBy('quantity')}
            >
              <Text style={[styles.filterText, sortBy === 'quantity' && styles.activeFilterText]}>Stock</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.viewToggle}>
            <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.viewBtn, viewMode === 'list' && styles.activeViewBtn]}>
              <Icon name="view-list" size={20} color={viewMode === 'list' ? colors.primary : colors.text.secondary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setViewMode('grid')} style={[styles.viewBtn, viewMode === 'grid' && styles.activeViewBtn]}>
              <Icon name="grid-view" size={20} color={viewMode === 'grid' ? colors.primary : colors.text.secondary} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={filteredProducts}
        renderItem={renderItem}
        keyExtractor={item => item.id?.toString() || Math.random().toString()}
        contentContainerStyle={styles.listContainer}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Icon name="search-off" size={48} color={colors.text.disabled} />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};

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
    color: colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Subtle glassmorphism
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  activeFilter: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  activeFilterText: {
    color: colors.text.inverse,
    fontWeight: '600',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  viewBtn: {
    padding: 6,
    borderRadius: 6,
  },
  activeViewBtn: {
    backgroundColor: colors.background,
  },
  listContainer: {
    padding: 16,
    paddingTop: 16,
  },
  productCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  gridItem: {
    flex: 1,
    margin: 6,
    padding: 12,
    maxWidth: Dimensions.get('window').width / 2 - 24,
  },
  cardContent: {
    flex: 1,
  },
  gridImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 12,
  },
  placeholderImage: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginRight: 8,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockText: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.text.secondary,
  },
});

export default CategoryProductsScreen;