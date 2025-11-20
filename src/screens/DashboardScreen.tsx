import React, { useState, useCallback, useLayoutEffect } from 'react';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  withTiming,
} from 'react-native-reanimated';

import type { RootStackParamList } from '../navigation/AppNavigator';
import DatabaseService, { Product } from '../database/DatabaseService';
import { useTheme } from '../theme/ThemeContext';
import ProductCard from '../components/ProductCard';
import SkeletonProductCard from '../components/SkeletonProductCard';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;
type SortOption = 'category' | 'nameAsc' | 'nameDesc' | 'priceAsc' | 'priceDesc' | 'discount';

// Extend the Product interface to include missing properties
interface ExtendedProduct extends Product {
  description?: string;
  image?: string;
}

const HEADER_MAX_HEIGHT = 120;
const HEADER_MIN_HEIGHT = Platform.OS === 'ios' ? 90 : 70;
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.primary,
    overflow: 'hidden',
    zIndex: 10,
    elevation: 4,
  },
  headerContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: HEADER_MIN_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    color: colors.text.inverse,
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    marginTop: HEADER_MAX_HEIGHT,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 5,
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
  listContainer: {
    padding: 16,
    paddingTop: 0, // Search container has margin
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
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 16,
  },
  sortOptionsContainer: {
    position: 'absolute',
    top: HEADER_MAX_HEIGHT + 60,
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
    backgroundColor: 'rgba(91, 141, 239, 0.2)',
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary,
  },
});

const PAGE_SIZE = 20;

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<ExtendedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [sortOption, setSortOption] = useState<SortOption>('nameAsc');
  const [showSortOptions, setShowSortOptions] = useState(false);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolate.CLAMP
    );

    return {
      height,
    };
  });

  const titleStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [1.2, 1],
      Extrapolate.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [10, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
    };
  });

  // Hide default header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const loadProducts = useCallback(async (reset: boolean = false) => {
    try {
      if (reset) {
        setLoading(true);
        setPage(0);
      } else {
        setLoadingMore(true);
      }

      const currentPage = reset ? 0 : page;
      const offset = currentPage * PAGE_SIZE;

      let newProducts: ExtendedProduct[] = [];

      if (searchQuery) {
        newProducts = await DatabaseService.searchProducts(searchQuery);
        setHasMore(false);
      } else {
        newProducts = await DatabaseService.getProducts(PAGE_SIZE, offset);
        if (newProducts.length < PAGE_SIZE) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }

      // Client-side sorting
      let sortedProducts = [...newProducts];
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

      if (reset) {
        setProducts(sortedProducts);
      } else {
        setProducts(prev => [...prev, ...sortedProducts]);
      }

      if (!reset) {
        setPage(prev => prev + 1);
      } else {
        setPage(1);
      }

    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [searchQuery, sortOption, page]);

  useFocusEffect(
    useCallback(() => {
      loadProducts(true);
    }, [searchQuery, sortOption])
  );

  const handleLoadMore = () => {
    if (!loadingMore && !loading && hasMore && !searchQuery) {
      loadProducts(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadProducts(true);
  };

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
        onPress={() => handleProductPress(item)}
        index={index}
      />
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
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
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      {/* Animated Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => {
              try {
                const parent = (navigation as any).getParent?.();
                if (parent?.dispatch) {
                  parent.dispatch(DrawerActions.toggleDrawer());
                } else {
                  navigation.dispatch(DrawerActions.toggleDrawer());
                }
              } catch (error) {
                console.error('Error toggling drawer:', error);
              }
            }}
            style={{ padding: 8 }}
          >
            <Icon name="menu" size={24} color={colors.text.inverse} />
          </TouchableOpacity>

          <Animated.Text style={[styles.headerTitle, titleStyle]}>
            Dashboard
          </Animated.Text>

          <TouchableOpacity
            onPress={() => setShowSortOptions((prev) => !prev)}
            style={{ padding: 8 }}
          >
            <Icon name="sort" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search products..."
          placeholderTextColor={colors.text.secondary}
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
        <View style={styles.listContainer}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <SkeletonProductCard key={i} />
          ))}
        </View>
      ) : (
        <Animated.FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id?.toString() || `product-${item.name}-${item.price}`}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={renderEmptyComponent}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} />
          }
          onScroll={scrollHandler}
          scrollEventThrottle={16}
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