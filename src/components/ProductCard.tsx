import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { Product } from '../database/DatabaseService';
import { useTheme } from '../theme/ThemeContext';

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  index?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onPress, index = 0 }) => {
  const { colors } = useTheme();
  const hasDiscount = product.discountPrice !== undefined && product.discountPrice < product.price;
  const discountPercentage = hasDiscount
    ? Math.round(((product.price - (product.discountPrice || 0)) / product.price) * 100)
    : 0;

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).springify()}
      layout={Layout.springify()}
    >
      <TouchableOpacity
        style={[styles.card, {
          backgroundColor: colors.surface,
          shadowColor: colors.shadow,
          borderColor: colors.border,
        }]}
        onPress={() => onPress(product)}
        activeOpacity={0.9}
      >
        <View style={styles.cardContent}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]} numberOfLines={2}>
              {product.name}
            </Text>
            <View style={[styles.categoryBadge, { backgroundColor: colors.secondary }]}>
              <Text style={[styles.categoryText, { color: colors.text.inverse }]}>{product.category}</Text>
            </View>
          </View>

          <View style={styles.priceContainer}>
            {hasDiscount ? (
              <>
                <Text style={[styles.originalPrice, { color: colors.text.secondary }]}>${product.price.toFixed(2)}</Text>
                <Text style={[styles.discountPrice, { color: colors.accent }]}>${product.discountPrice?.toFixed(2)}</Text>
                <View style={[styles.discountBadge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.discountText, { color: colors.text.inverse }]}>{discountPercentage}% OFF</Text>
                </View>
              </>
            ) : (
              <Text style={[styles.price, { color: colors.text.primary }]}>${product.price.toFixed(2)}</Text>
            )}
          </View>

          <View style={[styles.footer, { borderTopColor: colors.divider }]}>
            <Text style={[styles.detailsLabel, { color: colors.text.secondary }]}>
              {product.details ? 'Has details' : 'No details'}
            </Text>
            <View style={[styles.actionIcon, { backgroundColor: colors.background }]}>
              <Icon name="chevron-right" size={20} color={colors.primary} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    overflow: 'hidden',
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
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.3,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  originalPrice: {
    fontSize: 15,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountPrice: {
    fontSize: 20,
    fontWeight: '800',
    marginRight: 8,
    letterSpacing: -0.5,
  },
  discountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 12,
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  detailsLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionIcon: {
    borderRadius: 20,
    padding: 4,
  },
});

export default ProductCard;