import React, { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Image,
  Animated,
  RefreshControl,
} from 'react-native';
import { useNavigation, useRoute, RouteProp, DrawerActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import Icon from 'react-native-vector-icons/MaterialIcons';

import DatabaseService, { Product } from '../database/DatabaseService';
import { useTheme } from '../theme/ThemeContext';
import { calculateFinalPrice, formatPrice, calculateDiscountPercentage } from '../utils/PriceCalculator';

type CategoryProductsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CategoryProducts'>;
type CategoryProductsScreenRouteProp = RouteProp<RootStackParamList, 'CategoryProducts'>;

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(91, 141, 239, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(91, 141, 239, 0.25)',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterToggleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  searchContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 14,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  clearButton: {
    padding: 6,
    marginLeft: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  searchResultsCount: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  searchResultsText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  productCardPressed: {
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 0.98 }],
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 12,
    marginRight: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImagePlaceholder: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  productInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  productName: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
    lineHeight: 22,
  },
  productCategory: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
    fontWeight: '500',
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  gstBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  gstText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  inventoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  quantityText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: 12,
    fontWeight: '500',
  },
  stockBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  inStock: {
    backgroundColor: colors.success + '15',
    borderColor: colors.success + '25',
  },
  lowStock: {
    backgroundColor: colors.warning + '15',
    borderColor: colors.warning + '25',
  },
  outOfStock: {
    backgroundColor: colors.error + '15',
    borderColor: colors.error + '25',
  },
  stockText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: '600',
  },
  lowStockText: {
    color: colors.warning,
    fontWeight: '600',
  },
  outOfStockText: {
    color: colors.error,
    fontWeight: '600',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  originalPrice: {
    fontSize: 15,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.accent,
    marginRight: 10,
  },
  discountBadge: {
    backgroundColor: colors.accent + '15',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent + '25',
  },
  discountText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  finalPriceContainer: {
    backgroundColor: colors.success + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.success + '25',
  },
  finalPriceLabel: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '700',
  },
  skeletonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  skeletonImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: colors.surface,
    marginRight: 16,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: colors.surface,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonShortLine: {
    height: 16,
    backgroundColor: colors.surface,
    borderRadius: 4,
    marginBottom: 8,
    width: '60%',
  },
  skeletonPriceLine: {
    height: 14,
    backgroundColor: colors.surface,
    borderRadius: 4,
    width: '40%',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyActionButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyActionText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  filterContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterScrollContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 10,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  filterText: {
    fontSize: 13,
    color: colors.text.secondary,
    marginLeft: 8,
    fontWeight: '600',
  },
  filterTextActive: {
    color: colors.text.inverse,
    fontWeight: '700',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  viewToggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9,
    flex: 1,
    alignItems: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  viewToggleText: {
    fontSize: 13,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  viewToggleTextActive: {
    color: colors.text.inverse,
    fontWeight: '700',
  },
  productCardGrid: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    margin: 8,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
    width: '45%',
  },
  productImageGrid: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  productNameGrid: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  priceContainerGrid: {
    alignItems: 'center',
  },
  finalPriceGrid: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
    textAlign: 'center',
  },
});

const CategoryProductsScreen = () => {
  const navigation = useNavigation<CategoryProductsScreenNavigationProp>();
  const route = useRoute<CategoryProductsScreenRouteProp>();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { categoryName } = route.params;

  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'quantity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showFilters, setShowFilters] = useState(true);

  // Configure native header
  useLayoutEffect(() => {
    navigation.setOptions({
      title: categoryName,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            try {
              // Try multiple methods to access drawer
              const parent = (navigation as any).getParent?.();
              if (parent?.dispatch) {
                parent.dispatch(DrawerActions.toggleDrawer());
              } else if ((navigation as any).dispatch) {
                (navigation as any).dispatch(DrawerActions.toggleDrawer());
              } else {
                // Fallback: try to access drawer through root navigation
                const root = (navigation as any).getRootState?.();
                if (root?.routes?.[0]?.state) {
                  (navigation as any).dispatch(DrawerActions.toggleDrawer());
                }
              }
            } catch (error) {
              console.error('Error toggling drawer:', error);
            }
          }}
          style={{ paddingHorizontal: 8 }}
        >
          <Icon name="menu" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setShowFilters((prev) => !prev)}
          style={{ paddingHorizontal: 8 }}
        >
          <Icon name="tune" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.text.inverse, categoryName]);

  const sortedAndFilteredProducts = useMemo(() => {
    let filtered = products;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.details && product.details.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = a.discountPrice || a.price;
          bValue = b.discountPrice || b.price;
          break;
        case 'quantity':
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return sorted;
  }, [products, searchQuery, sortBy, sortOrder]);

  useFocusEffect(
    React.useCallback(() => {
      loadProductsByCategory();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryName])
  );

  const loadProductsByCategory = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      console.log('Loading products for category:', categoryName);
      await DatabaseService.initDatabase();
      const allProducts = await DatabaseService.getAllProducts();

      // Filter products by category
      const categoryProducts = allProducts.filter(
        (product) => product.category.toLowerCase() === categoryName.toLowerCase()
      );

      console.log(`Found ${categoryProducts.length} products in category ${categoryName}`);
      setProducts(categoryProducts);
    } catch (error) {
      console.error('Error loading products by category:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadProductsByCategory(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'grid' : 'list');
  };

  const renderSkeletonItem = () => (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonShortLine} />
        <View style={styles.skeletonLine} />
        <View style={styles.skeletonPriceLine} />
      </View>
    </View>
  );

  const renderSkeletonList = () => (
    <View style={styles.listContainer}>
      {Array.from({ length: 6 }).map((_, index) => (
        <View key={index}>{renderSkeletonItem()}</View>
      ))}
    </View>
  );

  const renderItem = ({ item }: { item: Product }) => {
    const discountPercentage = calculateDiscountPercentage(item.price, item.discountPrice || item.price);
    const priceCalculation = calculateFinalPrice(item.price, item.discountPrice, item.gstSlab || 0);

    if (viewMode === 'grid') {
      return (
        <TouchableOpacity
          style={styles.productCardGrid}
          onPress={() => {
            try {
              navigation.navigate('ProductDetail', { productId: item.id! });
            } catch (error) {
              console.error('Error navigating to product detail:', error);
              Alert.alert('Error', 'Failed to open product details');
            }
          }}
        >
          {item.imageUri ? (
            <Image source={{ uri: item.imageUri }} style={styles.productImageGrid} />
          ) : (
            <View style={[styles.productImageGrid, { backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' }]}>
              <Icon name="image" size={32} color={colors.text.disabled} />
            </View>
          )}
          <Text style={styles.productNameGrid} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.priceContainerGrid}>
            <Text style={styles.finalPriceGrid}>
              {formatPrice(priceCalculation.finalPrice)}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    // List view
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => {
          try {
            navigation.navigate('ProductDetail', { productId: item.id! });
          } catch (error) {
            console.error('Error navigating to product detail:', error);
            Alert.alert('Error', 'Failed to open product details');
          }
        }}
        activeOpacity={0.7}
      >
        {item.imageUri ? (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.productImage}
          />
        ) : (
          <View style={[styles.productImage, styles.productImagePlaceholder]}>
            <Icon name="image" size={32} color={colors.text.disabled} />
          </View>
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.productCategory}>{item.category}</Text>
          <View style={styles.productMeta}>
            {item.gstSlab && item.gstSlab > 0 && (
              <View style={styles.gstBadge}>
                <Text style={styles.gstText}>{item.gstSlab}% GST</Text>
              </View>
            )}
          </View>
          <View style={styles.inventoryInfo}>
            <Text style={styles.quantityText}>Qty: {item.quantity || 0}</Text>
            {item.quantity !== undefined && (
              <View style={[
                styles.stockBadge,
                item.quantity > 10 ? styles.inStock :
                  item.quantity > 0 ? styles.lowStock :
                    styles.outOfStock
              ]}>
                <Text style={[
                  styles.stockText,
                  item.quantity > 10 ? {} :
                    item.quantity > 0 ? styles.lowStockText :
                      styles.outOfStockText
                ]}>
                  {item.quantity > 10 ? 'In Stock' :
                    item.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.priceContainer}>
            {item.discountPrice ? (
              <>
                <Text style={styles.originalPrice}>₹{item.price.toFixed(2)}</Text>
                <Text style={styles.discountPrice}>₹{item.discountPrice.toFixed(2)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
                </View>
              </>
            ) : (
              <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
            )}
            <View style={styles.finalPriceContainer}>
              <Text style={styles.finalPriceLabel}>
                Final: {formatPrice(priceCalculation.finalPrice)}
              </Text>
            </View>
          </View>
        </View>
        <Icon name="chevron-right" size={20} color={colors.text.secondary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header handled by native navigation */}

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={colors.text.secondary}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => handleSearch('')}
            >
              <Icon name="close" size={20} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        {searchQuery.length > 0 && sortedAndFilteredProducts.length > 0 && (
          <View style={styles.searchResultsCount}>
            <Text style={styles.searchResultsText}>
              {sortedAndFilteredProducts.length} result{sortedAndFilteredProducts.length !== 1 ? 's' : ''} found
            </Text>
          </View>
        )}
      </View>

      {loading ? (
        renderSkeletonList()
      ) : (
        <>
          {/* Filter and Sort Controls */}
          {showFilters && (
            <View style={styles.filterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContainer}
              >
                <TouchableOpacity
                  style={[styles.filterButton, sortBy === 'name' && styles.filterButtonActive]}
                  onPress={() => setSortBy('name')}
                >
                  <Icon name="sort-by-alpha" size={16} color={sortBy === 'name' ? colors.text.inverse : colors.text.secondary} />
                  <Text style={[styles.filterText, sortBy === 'name' && styles.filterTextActive]}>Name</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterButton, sortBy === 'price' && styles.filterButtonActive]}
                  onPress={() => setSortBy('price')}
                >
                  <Icon name="currency-rupee" size={16} color={sortBy === 'price' ? colors.text.inverse : colors.text.secondary} />
                  <Text style={[styles.filterText, sortBy === 'price' && styles.filterTextActive]}>Price</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.filterButton, sortBy === 'quantity' && styles.filterButtonActive]}
                  onPress={() => setSortBy('quantity')}
                >
                  <Icon name="inventory" size={16} color={sortBy === 'quantity' ? colors.text.inverse : colors.text.secondary} />
                  <Text style={[styles.filterText, sortBy === 'quantity' && styles.filterTextActive]}>Stock</Text>
                </TouchableOpacity>
              </ScrollView>

              <TouchableOpacity style={styles.viewToggle} onPress={toggleViewMode}>
                <TouchableOpacity
                  style={[styles.viewToggleButton, viewMode === 'list' && styles.viewToggleButtonActive]}
                  onPress={() => setViewMode('list')}
                >
                  <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>List</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewToggleButton, viewMode === 'grid' && styles.viewToggleButtonActive]}
                  onPress={() => setViewMode('grid')}
                >
                  <Text style={[styles.viewToggleText, viewMode === 'grid' && styles.viewToggleTextActive]}>Grid</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}

          {sortedAndFilteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconContainer}>
                <Icon name={searchQuery ? "search-off" : "category"} size={48} color={colors.text.disabled} />
              </View>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No products found' : `No products in ${categoryName}`}
              </Text>
              <Text style={styles.emptySubText}>
                {searchQuery
                  ? 'Try adjusting your search terms or browse other categories'
                  : `Products in the "${categoryName}" category will appear here once added`
                }
              </Text>
              {searchQuery && (
                <TouchableOpacity
                  style={styles.emptyActionButton}
                  onPress={() => handleSearch('')}
                >
                  <Icon name="clear-all" size={20} color={colors.text.inverse} />
                  <Text style={styles.emptyActionText}>Clear Search</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <FlatList
              data={sortedAndFilteredProducts}
              renderItem={renderItem}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              contentContainerStyle={styles.listContainer}
              numColumns={viewMode === 'grid' ? 2 : 1}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              key={viewMode} // Force re-render when view mode changes
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

export default CategoryProductsScreen;