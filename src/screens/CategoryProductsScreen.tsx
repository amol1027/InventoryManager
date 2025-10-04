import React, { useState } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
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
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    top: 16,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
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
  finalPriceContainer: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 4,
  },
  finalPriceLabel: {
    color: colors.success,
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
});

const CategoryProductsScreen = () => {
  const navigation = useNavigation<CategoryProductsScreenNavigationProp>();
  const route = useRoute<CategoryProductsScreenRouteProp>();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const { categoryName } = route.params;

  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadProductsByCategory();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [categoryName])
  );

  const loadProductsByCategory = async () => {
    try {
      setLoading(true);
      console.log('Loading products for category:', categoryName);
      await DatabaseService.initDatabase();
      const allProducts = await DatabaseService.getAllProducts();

      // Filter products by category
      const categoryProducts = allProducts.filter(
        (product) => product.category.toLowerCase() === categoryName.toLowerCase()
      );

      console.log(`Found ${categoryProducts.length} products in category ${categoryName}`);
      setProducts(categoryProducts);
      setFilteredProducts(categoryProducts);
    } catch (error) {
      console.error('Error loading products by category:', error);
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

  const renderItem = ({ item }: { item: Product }) => {
    const discountPercentage = calculateDiscountPercentage(item.price, item.discountPrice || item.price);
    const priceCalculation = calculateFinalPrice(item.price, item.discountPrice, item.gstSlab || 0);

    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => {
          try {
            // Navigate to ProductDetail screen within the same stack
            navigation.navigate('ProductDetail', { productId: item.id! });
          } catch (error) {
            console.error('Error navigating to product detail:', error);
            Alert.alert('Error', 'Failed to open product details');
          }
        }}
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
                <Text style={styles.originalPrice}>₹{item.price.toFixed(2)}</Text>
                <Text style={styles.discountPrice}>₹{item.discountPrice.toFixed(2)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
                </View>
              </>
            ) : (
              <Text style={styles.price}>₹{item.price.toFixed(2)}</Text>
            )}
            <View style={[styles.finalPriceContainer, { backgroundColor: colors.success + '20' }]}>
              <Text style={[styles.finalPriceLabel, { color: colors.success }]}>
                Final: {formatPrice(priceCalculation.finalPrice)}
              </Text>
            </View>
          </View>
        </View>
        <Icon name="chevron-right" size={24} color={colors.text.secondary} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{categoryName}</Text>
        <Text style={styles.headerSubtitle}>{filteredProducts.length} products</Text>
      </View>

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
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : filteredProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="category" size={64} color={colors.text.disabled} />
          <Text style={styles.emptyText}>No products found</Text>
          <Text style={styles.emptySubText}>
            {searchQuery ? 'Try a different search term' : `No products in ${categoryName} category`}
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
    </View>
  );
};

export default CategoryProductsScreen;
