import React, { useState, useEffect } from 'react';
import { ViewStyle, TextStyle, ImageStyle } from 'react-native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  Dimensions,
  Animated,
  Modal,
  Share,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

import { RootStackParamList } from '../navigation/AppNavigator';
import DatabaseService, { Product } from '../database/DatabaseService';
import { useTheme } from '../theme/ThemeContext';

type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>;

const GST_SLABS = [0, 5, 12, 18, 28];

const ProductDetailScreen = () => {
  const route = useRoute<ProductDetailScreenRouteProp>();
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const { colors } = useTheme();
  const { productId } = route.params;

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];

  // State variables
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageScale, setImageScale] = useState(new Animated.Value(1));
  const [categories, setCategories] = useState<string[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [gstSlab, setGstSlab] = useState<number>(GST_SLABS[0]);
  const [details, setDetails] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState({
    name: '',
    price: '',
    discountPrice: '',
  });

  useEffect(() => {
    loadProduct();
  }, [productId]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!loading && product) {
      // Animate content in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, product]);

  const loadCategories = async () => {
    try {
      await DatabaseService.initDatabase();
      const categoriesData = await DatabaseService.getAllCategories();
      const categoryNames = categoriesData.map(cat => cat.name);
      setCategories(categoryNames);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      await DatabaseService.initDatabase();
      const fetchedProduct = await DatabaseService.getProductById(productId);

      if (fetchedProduct) {
        setProduct(fetchedProduct);
        setName(fetchedProduct.name);
        setCategory(fetchedProduct.category);
        setPrice(fetchedProduct.price.toString());
        setQuantity(fetchedProduct.quantity?.toString() || '0');
        setDiscountPrice(fetchedProduct.discountPrice?.toString() || '');
        setGstSlab(fetchedProduct.gstSlab || GST_SLABS[0]);
        setDetails(fetchedProduct.details || '');
        setImageUri(fetchedProduct.imageUri);
      } else {
        Alert.alert('Error', 'Product not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = { name: '', price: '', discountPrice: '' };

    if (!name.trim()) {
      newErrors.name = 'Product name is required';
      isValid = false;
    }

    if (!price.trim()) {
      newErrors.price = 'Price is required';
      isValid = false;
    } else {
      const priceValue = parseFloat(price);
      if (isNaN(priceValue) || priceValue <= 0) {
        newErrors.price = 'Price must be a positive number';
        isValid = false;
      }
    }

    if (discountPrice.trim()) {
      const discountValue = parseFloat(discountPrice);
      const priceValue = parseFloat(price);

      if (isNaN(discountValue)) {
        newErrors.discountPrice = 'Discount price must be a number';
        isValid = false;
      } else if (discountValue >= priceValue) {
        newErrors.discountPrice = 'Discount price must be less than regular price';
        isValid = false;
      } else if (discountValue < 0) {
        newErrors.discountPrice = 'Discount price cannot be negative';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const pickImage = () => {
    Alert.alert('Select Image Source', 'Choose where to get the image from', [
      {
        text: 'Camera',
        onPress: () => {
          launchCamera({ mediaType: 'photo', includeBase64: false }, (response) => {
            if (!response.didCancel && !response.errorCode && response.assets?.[0]?.uri) {
              setImageUri(response.assets[0].uri);
            }
          });
        },
      },
      {
        text: 'Gallery',
        onPress: () => {
          launchImageLibrary({ mediaType: 'photo', includeBase64: false }, (response) => {
            if (!response.didCancel && !response.errorCode && response.assets?.[0]?.uri) {
              setImageUri(response.assets[0].uri);
            }
          });
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleShare = async () => {
    if (!product) return;

    try {
      const shareMessage = `Check out this product: ${product.name}\nPrice: ₹${product.price.toFixed(2)}${product.discountPrice ? ` (Discount: ₹${product.discountPrice.toFixed(2)})` : ''}\nCategory: ${product.category}`;

      await Share.share({
        message: shareMessage,
      });
    } catch (error) {
      console.error('Error sharing product:', error);
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const updatedProduct: Product = {
        ...product,
        id: productId,
        name,
        category,
        price: parseFloat(price),
        quantity: quantity?.trim() ? parseInt(quantity, 10) : 0,
        discountPrice: discountPrice?.trim() ? parseFloat(discountPrice) : undefined,
        gstSlab,
        details: details.trim() || undefined,
        imageUri,
      };

      await DatabaseService.updateProduct(updatedProduct);
      setProduct(updatedProduct);
      setIsEditing(false);
      Alert.alert('Success', 'Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      Alert.alert('Error', 'Failed to update product');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setPrice(product.price.toString());
      setQuantity(product.quantity?.toString() || '0');
      setDiscountPrice(product.discountPrice?.toString() || '');
      setGstSlab(product.gstSlab || GST_SLABS[0]);
      setDetails(product.details || '');
      setImageUri(product.imageUri);
      setErrors({ name: '', price: '', discountPrice: '' });
    }
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product?.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseService.deleteProduct(productId);
              Alert.alert('Success', 'Product deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting product:', error);
              Alert.alert('Error', 'Failed to delete product');
            }
          },
        },
      ]
    );
  };

  const handleImageZoom = () => {
    if (product?.imageUri) {
      setImageModalVisible(true);
    }
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonImage} />
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonBadge} />
        <View style={styles.skeletonBadge} />
        <View style={styles.skeletonPrice} />
        <View style={styles.skeletonInfoGrid} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <LoadingSkeleton />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={80} color={colors.error} />
          <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
            Product Not Found
          </Text>
          <Text style={[styles.errorSubtitle, { color: colors.text.secondary }]}>
            The product you're looking for doesn't exist or has been deleted.
          </Text>
          <TouchableOpacity
            style={[styles.errorButton, { backgroundColor: colors.primary }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.errorButtonText, { color: colors.text.inverse }]}>
              Go Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const discountPercentage = product.discountPrice
    ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
    : 0;

  const stockStatus = !product.quantity || product.quantity === 0
    ? {
        text: 'Out of Stock',
        color: colors.error,
        bg: 'rgba(220, 53, 69, 0.15)',
        icon: 'remove-circle',
        severity: 'high'
      }
    : product.quantity <= 10
    ? {
        text: 'Low Stock',
        color: colors.warning,
        bg: 'rgba(255, 193, 7, 0.15)',
        icon: 'warning',
        severity: 'medium'
      }
    : {
        text: 'In Stock',
        color: colors.success,
        bg: 'rgba(40, 167, 69, 0.15)',
        icon: 'check-circle',
        severity: 'good'
      };

  if (isEditing) {
    return (
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.editHeader}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.surface }]}
            onPress={handleCancel}
            disabled={isSaving}
          >
            <Icon name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
            Edit Product
          </Text>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: colors.surface }]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Icon name="check" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Product Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: errors.name ? colors.error : colors.border, color: colors.text.primary }
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Enter product name"
              placeholderTextColor={colors.text.disabled}
            />
            {errors.name ? (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.name}
              </Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Category *
            </Text>
            <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Picker
                selectedValue={category}
                onValueChange={setCategory}
                style={[styles.picker, { color: colors.text.primary }]}
              >
                {categories.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Price (₹) *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, borderColor: errors.price ? colors.error : colors.border, color: colors.text.primary }
                ]}
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor={colors.text.disabled}
              />
              {errors.price ? (
                <Text style={[styles.errorText, { color: colors.error }]}>
                  {errors.price}
                </Text>
              ) : null}
            </View>

            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={[styles.label, { color: colors.text.primary }]}>
                Quantity
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }
                ]}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="0"
                keyboardType="number-pad"
                placeholderTextColor={colors.text.disabled}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Discount Price (₹)
            </Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: errors.discountPrice ? colors.error : colors.border, color: colors.text.primary }
              ]}
              value={discountPrice}
              onChangeText={setDiscountPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.text.disabled}
            />
            {errors.discountPrice ? (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {errors.discountPrice}
              </Text>
            ) : null}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              GST Slab (%)
            </Text>
            <View style={[styles.pickerContainer, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              <Picker
                selectedValue={gstSlab}
                onValueChange={setGstSlab}
                style={[styles.picker, { color: colors.text.primary }]}
              >
                {GST_SLABS.map((slab) => (
                  <Picker.Item key={slab} label={`${slab}%`} value={slab} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Product Image
            </Text>
            <TouchableOpacity
              style={[styles.imagePicker, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={pickImage}
            >
              <Icon name="add-photo-alternate" size={24} color={colors.primary} />
              <Text style={[styles.imagePickerText, { color: colors.primary }]}>
                {imageUri ? 'Change Image' : 'Add Product Image'}
              </Text>
            </TouchableOpacity>
            {imageUri && (
              <TouchableOpacity onPress={handleImageZoom}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text.primary }]}>
              Additional Details
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text.primary }
              ]}
              value={details}
              onChangeText={setDetails}
              placeholder="Enter product details, specifications, etc."
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={colors.text.disabled}
            />
          </View>
        </View>

        {/* Image Zoom Modal */}
        <Modal
          visible={imageModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setImageModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalBackdrop}
              onPress={() => setImageModalVisible(false)}
              activeOpacity={1}
            >
              <TouchableOpacity
                style={styles.modalContent}
                onPress={() => setImageModalVisible(false)}
                activeOpacity={1}
              >
                {imageUri && (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                )}
                <TouchableOpacity
                  style={[styles.closeButton, { backgroundColor: colors.surface }]}
                  onPress={() => setImageModalVisible(false)}
                >
                  <Icon name="close" size={24} color={colors.text.primary} />
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </Modal>
      </ScrollView>
    );
  }

  return (
    <Animated.ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Custom Header */}
      <View style={[styles.customHeader, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.background }]}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Product Details
        </Text>

        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: colors.background }]}
          onPress={handleShare}
        >
          <Icon name="share" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Image Section */}
        <View style={styles.imageSection}>
          <TouchableOpacity onPress={handleImageZoom} activeOpacity={0.9}>
            {product.imageUri ? (
              <Image
                source={{ uri: product.imageUri }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.noImageContainer, { backgroundColor: colors.surface }]}>
                <Icon name="image" size={64} color={colors.text.disabled} />
                <Text style={[styles.noImageText, { color: colors.text.disabled }]}>
                  No Image Available
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {discountPercentage > 0 && (
            <View style={[styles.discountBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.discountText, { color: colors.text.inverse }]}>
                {discountPercentage}% OFF
              </Text>
            </View>
          )}
        </View>

        {/* Product Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.productTitle, { color: colors.text.primary }]}>
            {product.name}
          </Text>

          <View style={styles.metaContainer}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary }]}>
              <Icon name="category" size={16} color={colors.text.inverse} />
              <Text style={[styles.categoryText, { color: colors.text.inverse }]}>
                {product.category}
              </Text>
            </View>

            <View style={[styles.stockBadge, { backgroundColor: stockStatus.bg }]}>
              <Icon name={stockStatus.icon} size={16} color={stockStatus.color} />
              <Text style={[styles.stockText, { color: stockStatus.color }]}>
                {stockStatus.text}
              </Text>
            </View>
          </View>
        </View>

        {/* Price Card */}
        <View style={[styles.priceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.priceHeader}>
            <Icon name="currency-rupee" size={24} color={colors.primary} />
            <Text style={[styles.priceLabel, { color: colors.text.secondary }]}>
              Price Information
            </Text>
          </View>

          {product.discountPrice ? (
            <View style={styles.discountContainer}>
              <View style={styles.priceRow}>
                <Text style={[styles.originalPrice, { color: colors.text.secondary }]}>
                  ₹{product.price.toFixed(2)}
                </Text>
                <Text style={[styles.discountPrice, { color: colors.accent }]}>
                  ₹{product.discountPrice.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.savingsBadge, { backgroundColor: colors.accent }]}>
                <Icon name="savings" size={16} color={colors.text.inverse} />
                <Text style={[styles.savingsText, { color: colors.text.inverse }]}>
                  Save ₹{(product.price - product.discountPrice).toFixed(2)} ({discountPercentage}%)
                </Text>
              </View>
            </View>
          ) : (
            <Text style={[styles.regularPrice, { color: colors.primary }]}>
              ₹{product.price.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Info Grid */}
        <View style={styles.infoGrid}>
          <View style={[styles.infoItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.infoIconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Icon name="inventory" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
              Stock Quantity
            </Text>
            <Text style={[styles.infoValue, { color: colors.text.primary }]}>
              {product.quantity || 0}
            </Text>
          </View>

          <View style={[styles.infoItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.infoIconContainer, { backgroundColor: colors.secondary + '20' }]}>
              <Icon name="receipt" size={24} color={colors.secondary} />
            </View>
            <Text style={[styles.infoLabel, { color: colors.text.secondary }]}>
              GST Slab
            </Text>
            <Text style={[styles.infoValue, { color: colors.text.primary }]}>
              {product.gstSlab || 0}%
            </Text>
          </View>
        </View>

        {/* Details Section */}
        {product.details && (
          <View style={[styles.detailsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.detailsHeader}>
              <Icon name="description" size={24} color={colors.primary} />
              <Text style={[styles.detailsTitle, { color: colors.text.primary }]}>
                Product Details
              </Text>
            </View>
            <Text style={[styles.detailsText, { color: colors.text.primary }]}>
              {product.details}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={() => setIsEditing(true)}
          >
            <Icon name="edit" size={20} color={colors.text.inverse} />
            <Text style={[styles.actionButtonText, { color: colors.text.inverse }]}>
              Edit Product
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={handleDelete}
          >
            <Icon name="delete" size={20} color={colors.text.inverse} />
            <Text style={[styles.actionButtonText, { color: colors.text.inverse }]}>
              Delete Product
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Image Zoom Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            onPress={() => setImageModalVisible(false)}
            activeOpacity={1}
          >
            <View style={styles.modalContent}>
              {product.imageUri && (
                <Image
                  source={{ uri: product.imageUri }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: colors.surface }]}
                onPress={() => setImageModalVisible(false)}
              >
                <Icon name="close" size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </Animated.ScrollView>
  );
};

const styles = {
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  skeletonContainer: {
    padding: 16,
  },
  skeletonImage: {
    width: Dimensions.get('window').width - 32,
    height: 300,
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
    marginBottom: 16,
  },
  skeletonContent: {
    padding: 16,
  },
  skeletonTitle: {
    height: 28,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 12,
  },
  skeletonBadge: {
    height: 24,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'flex-start' as const,
  },
  skeletonPrice: {
    height: 36,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    marginBottom: 16,
  },
  skeletonInfoGrid: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  errorContainer: {
    alignItems: 'center' as const,
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 16,
    textAlign: 'center' as const,
    marginBottom: 24,
    lineHeight: 24,
  },
  errorButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  customHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
  },
  content: {
    padding: 16,
  },
  imageSection: {
    position: 'relative' as const,
    marginBottom: 16,
  },
  productImage: {
    width: Dimensions.get('window').width - 32,
    height: 280,
    borderRadius: 16,
  },
  noImageContainer: {
    width: Dimensions.get('window').width - 32,
    height: 280,
    borderRadius: 16,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  noImageText: {
    fontSize: 16,
    fontWeight: '500' as const,
    marginTop: 12,
  },
  discountBadge: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  discountText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    marginBottom: 16,
    lineHeight: 32,
  },
  metaContainer: {
    flexDirection: 'row' as const,
    gap: 12,
  },
  categoryBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  stockBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  priceCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  priceHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    gap: 8,
  },
  priceLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  discountContainer: {
    gap: 12,
  },
  priceRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  originalPrice: {
    fontSize: 18,
    textDecorationLine: 'line-through' as const,
  },
  discountPrice: {
    fontSize: 32,
    fontWeight: 'bold' as const,
  },
  savingsBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    alignSelf: 'flex-start' as const,
  },
  savingsText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  regularPrice: {
    fontSize: 32,
    fontWeight: 'bold' as const,
  },
  infoGrid: {
    flexDirection: 'row' as const,
    gap: 12,
    marginBottom: 16,
  },
  infoItem: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center' as const,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: 'bold' as const,
  },
  detailsCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  detailsHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: 16,
    gap: 8,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
  },
  detailsText: {
    fontSize: 15,
    lineHeight: 24,
  },
  actionContainer: {
    gap: 12,
    marginBottom: 32,
  },
  editButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  deleteButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  editHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  formContainer: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row' as const,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500' as const,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden' as const,
  },
  picker: {
    height: 54,
  },
  imagePicker: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    borderWidth: 2,
    borderStyle: 'dashed' as const,
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  imagePreview: {
    width: Dimensions.get('window').width - 64,
    height: 200,
    borderRadius: 12,
    marginTop: 12,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top' as const,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalBackdrop: {
    flex: 1,
    width: Dimensions.get('window').width,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  modalContent: {
    position: 'relative' as const,
    width: 300,
    height: 400,
  },
  modalImage: {
    width: 300,
    height: 400,
    borderRadius: 16,
  },
  closeButton: {
    position: 'absolute' as const,
    top: -50,
    right: -50,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
} as const;

export default ProductDetailScreen;
