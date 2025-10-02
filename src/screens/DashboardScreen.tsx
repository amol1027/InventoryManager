import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList } from '../navigation/AppNavigator';
import DatabaseService, { Product } from '../database/DatabaseService';
import { colors } from '../theme/colors';

type DashboardScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Dashboard'>;

type SortOption = 'category' | 'nameAsc' | 'nameDesc' | 'priceAsc' | 'priceDesc' | 'discount';

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('nameAsc');
  const [showSortOptions, setShowSortOptions] = useState(false);

  useFocusEffect(
    React.useCallback(() => {
      loadProducts();
    }, [])
  );

  const loadProducts = async () => {
    try {
      setLoading(true);
      await DatabaseService.initDatabase();
      const allProducts = await DatabaseService.getAllProducts();
      setProducts(allProducts);
      setFilteredProducts(allProducts);
      sortProducts(allProducts, sortOption);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (product) =>
          product.name.toLowerCase().includes(query.toLowerCase()) ||
          product.category.toLowerCase().includes(query.toLowerCase()) ||
          (product.details && product.details.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredProducts(filtered);
    }
  };

  const sortProducts = (productsToSort: Product[], option: SortOption) => {
    let sorted = [...productsToSort];
    
    switch (option) {
      case 'category':
        sorted.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'nameAsc':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'nameDesc':
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'priceAsc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'priceDesc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'discount':
        sorted.sort((a, b) => {
          const discountA = a.discountPrice ? ((a.price - a.discountPrice) / a.price) * 100 : 0;
          const discountB = b.discountPrice ? ((b.price - b.discountPrice) / b.price) * 100 : 0;
          return discountB - discountA;
        });
        break;
      default:
        break;
    }
    
    setFilteredProducts(sorted);
    setSortOption(option);
  };

  const handleSortChange = (option: SortOption) => {
    sortProducts(filteredProducts, option);
    setShowSortOptions(false);
  };

  const renderSortOptions = () => {
    if (!showSortOptions) return null;
    
    return (
      <View style={styles.sortOptionsContainer}>
        <TouchableOpacity
          style={styles.sortOption}
          onPress={() => handleSortChange('category')}
        >
          <Text style={sortOption === 'category' ? styles.selectedSortText : styles.sortText}>
            By Category
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortOption}
          onPress={() => handleSortChange('nameAsc')}
        >
          <Text style={sortOption === 'nameAsc' ? styles.selectedSortText : styles.sortText}>
            Name (A-Z)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortOption}
          onPress={() => handleSortChange('nameDesc')}
        >
          <Text style={sortOption === 'nameDesc' ? styles.selectedSortText : styles.sortText}>
            Name (Z-A)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortOption}
          onPress={() => handleSortChange('priceAsc')}
        >
          <Text style={sortOption === 'priceAsc' ? styles.selectedSortText : styles.sortText}>
            Price (Low-High)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortOption}
          onPress={() => handleSortChange('priceDesc')}
        >
          <Text style={sortOption === 'priceDesc' ? styles.selectedSortText : styles.sortText}>
            Price (High-Low)
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.sortOption}
          onPress={() => handleSortChange('discount')}
        >
          <Text style={sortOption === 'discount' ? styles.selectedSortText : styles.sortText}>
            Discount %
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderItem = ({ item }: { item: Product }) => {
    const discountPercentage = item.discountPrice
      ? Math.round(((item.price - item.discountPrice) / item.price) * 100)
      : 0;

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id || 0 })}
      >
        {item.imageUri && (
          <Image
            source={{ uri: item.imageUri }}
            style={styles.productImage}
          />
        )}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{item.name}</Text>
          <View style={styles.productMeta}>
            <Text style={styles.productCategory}>{item.category}</Text>
            {item.gstSlab && item.gstSlab > 0 && (
              <View style={styles.gstBadge}>
                <Text style={styles.gstText}>{item.gstSlab}% GST</Text>
              </View>
            )}
          </View>
          <View style={styles.inventoryInfo}>
            <Text style={styles.quantityText}>Qty: {item.quantity || 0}</Text>
            {item.quantity !== undefined && item.quantity > 0 && (
              <View style={[styles.stockBadge, item.quantity > 10 ? styles.inStock : styles.lowStock]}>
                <Text style={styles.stockText}>
                  {item.quantity > 10 ? 'In Stock' : item.quantity > 0 ? 'Low Stock' : 'Out of Stock'}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.priceContainer}>
            {item.discountPrice ? (
              <>
                <Text style={styles.originalPrice}>${item.price.toFixed(2)}</Text>
                <Text style={styles.discountPrice}>${item.discountPrice.toFixed(2)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
                </View>
              </>
            ) : (
              <Text style={styles.price}>${item.price.toFixed(2)}</Text>
            )}
          </View>
        </View>
        <Icon name="chevron-right" size={24} color={colors.text.secondary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={24} color={colors.text.secondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Icon name="close" size={24} color={colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <Icon name="sort" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>

      {renderSortOptions()}

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inventory" size={64} color={colors.text.disabled} />
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubText}>
            {searchQuery ? 'Try a different search term' : 'Add your first product'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={styles.listContainer}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddItem')}
      >
        <Icon name="add" size={24} color={colors.text.inverse} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
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
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: colors.text.primary,
  },
  sortButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortOptionsContainer: {
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    padding: 8,
  },
  sortOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sortText: {
    color: colors.text.primary,
  },
  selectedSortText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gstBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  gstText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '500',
  },
  inventoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginRight: 12,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  inStock: {
    backgroundColor: colors.success,
  },
  lowStock: {
    backgroundColor: colors.warning,
  },
  stockText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  price: {
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  originalPrice: {
    fontSize: 14,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.accent,
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: 'bold',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 8,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default DashboardScreen;