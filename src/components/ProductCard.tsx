import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Product } from '../database/DatabaseService';
import { colors } from '../theme/colors';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress }) => {
  const hasDiscount = product.discountPrice !== undefined && product.discountPrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - (product.discountPrice || 0)) / product.price) * 100)
    : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(product)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          {hasDiscount ? (
            <>
              <Text style={styles.originalPrice}>${product.price.toFixed(2)}</Text>
              <Text style={styles.discountPrice}>${product.discountPrice?.toFixed(2)}</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
              </View>
            </>
          ) : (
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.detailsLabel}>
            {product.details ? 'Has details' : 'No details'}
          </Text>
          <Icon name="chevron-right" size={20} color={colors.text.secondary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
    marginRight: 8,
  },
  categoryBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  categoryText: {
    color: colors.text.inverse,
    fontSize: 12,
    fontWeight: '500',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  price: {
    fontSize: 18,
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
    fontSize: 18,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailsLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});

export default ProductCard;