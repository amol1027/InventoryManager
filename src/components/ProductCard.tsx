import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTheme } from '../theme/ThemeContext';
import { calculateFinalPrice } from '../utils/PriceCalculator';
import { Product } from '../database/DatabaseService';

interface ExtendedProduct extends Product {
  description?: string;
  image?: string;
}

interface ProductCardProps {
  product: ExtendedProduct;
  onPress: (product: ExtendedProduct) => void;
  index: number;
}

const getStyles = (colors: any) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: 'rgba(91, 141, 239, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: '500',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'column',
  },
  finalPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.success,
  },
  gstLabel: {
    fontSize: 10,
    color: colors.text.secondary,
  },
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  discountBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderBottomRightRadius: 8,
    zIndex: 1,
  },
  discountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, index }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const priceCalculation = calculateFinalPrice(product.price || 0, product.discountPrice, product.gstSlab || 0);
  const hasDiscount = product.discountPrice && product.discountPrice < (product.price || 0);
  const discountAmount = product.discountPrice ? (product.price || 0) - product.discountPrice : 0;

  // Determine stock status color
  let stockColor = colors.success;
  let stockIcon = 'check-circle';
  let stockText = 'In Stock';

  if ((product.quantity || 0) <= 0) {
    stockColor = colors.error;
    stockIcon = 'error';
    stockText = 'Out of Stock';
  } else if ((product.quantity || 0) < 10) {
    stockColor = colors.warning;
    stockIcon = 'warning';
    stockText = 'Low Stock';
  }

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify()}>
      <TouchableOpacity
        style={styles.card}
        onPress={() => onPress(product)}
        activeOpacity={0.7}
      >
        <View style={styles.contentContainer}>
          <View style={styles.imageContainer}>
            {hasDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>SALE</Text>
              </View>
            )}
            {product.imageUri ? (
              <Image
                source={{ uri: product.imageUri }}
                style={styles.image}
                resizeMode="cover"
              />
            ) : (
              <Icon name="image" size={32} color={colors.text.secondary} />
            )}
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.name} numberOfLines={1}>
                {product.name}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{product.category}</Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.finalPrice}>₹{priceCalculation.finalPrice.toFixed(2)}</Text>
                <Text style={styles.gstLabel}>
                  +₹{priceCalculation.gstAmount.toFixed(2)} GST ({priceCalculation.gstPercentage}%)
                </Text>
              </View>

              <View style={styles.stockContainer}>
                <Icon name={stockIcon} size={14} color={stockColor} />
                <Text style={[styles.stockText, { color: stockColor }]}>
                  {product.quantity || 0} Left
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default ProductCard;