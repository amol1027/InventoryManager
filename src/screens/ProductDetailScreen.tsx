import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate,
  withTiming,
  withDelay,
  FadeInDown,
  runOnJS,
} from 'react-native-reanimated';
import { ErrorHandler, DatabaseErrorHandler } from '../utils/ErrorHandler';
import { ConfirmationDialog } from '../utils/ConfirmationDialog';
import DatabaseService, { Product } from '../database/DatabaseService';
import { useTheme } from '../theme/ThemeContext';
import { calculateFinalPrice, calculateDiscountPercentage } from '../utils/PriceCalculator';

const GST_SLABS = [0, 5, 12, 18, 28];
const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 300;
const COLLAPSED_HEADER_HEIGHT = Platform.OS === 'ios' ? 90 : 70;

type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>;

const ProductDetailScreen = () => {
  const route = useRoute<ProductDetailScreenRouteProp>();
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const { colors } = useTheme();
  const { productId } = route.params;

  // Animation values
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(0);

  // State variables
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imageModalVisible, setImageModalVisible] = useState(false);
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
    loadCategories();
  }, [productId]);

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

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      const updatedProduct: Product = {
        ...product!,
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
    if (!product) return;

    ConfirmationDialog.showDelete(
      product.name,
      async () => {
        try {
          await DatabaseService.deleteProduct(productId);
          Alert.alert('Success', 'Product deleted successfully', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } catch (error) {
          ErrorHandler.handle(
            DatabaseErrorHandler.createDatabaseError('Failed to delete product', error as Error),
            'ProductDetailScreen.handleDelete'
          );
        }
      }
    );
  };

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
    if (event.contentOffset.y > HEADER_HEIGHT - COLLAPSED_HEADER_HEIGHT) {
      headerOpacity.value = withTiming(1);
    } else {
      headerOpacity.value = withTiming(0);
    }
  });

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
    };
  });

  const imageAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [-HEADER_HEIGHT, 0, HEADER_HEIGHT],
      [HEADER_HEIGHT / 2, 0, -HEADER_HEIGHT / 3],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [-HEADER_HEIGHT, 0],
      [2, 1],
      Extrapolate.CLAMP
    );
    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const styles = getStyles(colors);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) return null;

  const discountPercentage = calculateDiscountPercentage(product.price, product.discountPrice || product.price);
  const priceCalculation = calculateFinalPrice(product.price, product.discountPrice, product.gstSlab || 0);

  const stockStatus = !product.quantity || product.quantity === 0
    ? { text: 'Out of Stock', color: colors.error, icon: 'remove-circle' }
    : product.quantity <= 10
      ? { text: 'Low Stock', color: colors.warning, icon: 'warning' }
      : { text: 'In Stock', color: colors.success, icon: 'check-circle' };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* Collapsed Header */}
      <Animated.View style={[styles.collapsedHeader, headerAnimatedStyle]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.text.inverse} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.headerAction}>
              <Icon name={isEditing ? "close" : "edit"} size={24} color={colors.text.inverse} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Floating Back Button (Visible when header is transparent) */}
      <Animated.View style={[styles.floatingBackButton, { opacity: interpolate(headerOpacity.value, [0, 1], [1, 0]) }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundButton}>
          <Icon name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      </Animated.View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <Animated.Image
            source={imageUri ? { uri: imageUri } : require('../assets/placeholder.png')}
            style={[styles.heroImage, imageAnimatedStyle]}
            resizeMode="cover"
          />
          <View style={styles.imageOverlay} />

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <Animated.Text entering={FadeInDown.delay(100).duration(600)} style={styles.heroCategory}>
              {product.category}
            </Animated.Text>
            <Animated.Text entering={FadeInDown.delay(200).duration(600)} style={styles.heroTitle}>
              {product.name}
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.heroMeta}>
              <View style={[styles.badge, { backgroundColor: stockStatus.color }]}>
                <Icon name={stockStatus.icon} size={16} color="#FFF" />
                <Text style={styles.badgeText}>{stockStatus.text}</Text>
              </View>
              {discountPercentage > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.error }]}>
                  <Icon name="local-offer" size={16} color="#FFF" />
                  <Text style={styles.badgeText}>{discountPercentage}% OFF</Text>
                </View>
              )}
            </Animated.View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          {isEditing ? (
            // Edit Mode Form
            <Animated.View entering={FadeInDown.duration(400)}>
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Edit Product</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Product Name</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter product name"
                    placeholderTextColor={colors.text.secondary}
                  />
                  {!!errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={category}
                      onValueChange={setCategory}
                      style={styles.picker}
                      dropdownIconColor={colors.text.primary}
                    >
                      {categories.map((cat) => (
                        <Picker.Item key={cat} label={cat} value={cat} color={colors.text.primary} />
                      ))}
                    </Picker>
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Price (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="numeric"
                      placeholder="0.00"
                      placeholderTextColor={colors.text.secondary}
                    />
                    {!!errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>Discount Price (₹)</Text>
                    <TextInput
                      style={styles.input}
                      value={discountPrice}
                      onChangeText={setDiscountPrice}
                      keyboardType="numeric"
                      placeholder="Optional"
                      placeholderTextColor={colors.text.secondary}
                    />
                    {!!errors.discountPrice && <Text style={styles.errorText}>{errors.discountPrice}</Text>}
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Quantity</Text>
                    <TextInput
                      style={styles.input}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.text.secondary}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>GST Slab (%)</Text>
                    <View style={styles.pickerContainer}>
                      <Picker
                        selectedValue={gstSlab}
                        onValueChange={setGstSlab}
                        style={styles.picker}
                        dropdownIconColor={colors.text.primary}
                      >
                        {GST_SLABS.map((slab) => (
                          <Picker.Item key={slab} label={`${slab}%`} value={slab} color={colors.text.primary} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={details}
                    onChangeText={setDetails}
                    multiline
                    numberOfLines={4}
                    placeholder="Enter product details..."
                    placeholderTextColor={colors.text.secondary}
                  />
                </View>

                <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
                  <Icon name="add-photo-alternate" size={24} color={colors.primary} />
                  <Text style={styles.imagePickerText}>Change Image</Text>
                </TouchableOpacity>

                <View style={styles.actionButtons}>
                  <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={isSaving}>
                    {isSaving ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.saveButtonText}>Save Changes</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          ) : (
            // View Mode
            <>
              <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.priceSection}>
                <View>
                  <Text style={styles.priceLabel}>Final Price</Text>
                  <Text style={styles.finalPrice}>₹{priceCalculation.finalPrice.toFixed(2)}</Text>
                  {product.discountPrice && (
                    <Text style={styles.originalPrice}>₹{product.price.toFixed(2)}</Text>
                  )}
                </View>
                <View style={styles.gstInfo}>
                  <Text style={styles.gstLabel}>GST ({product.gstSlab}%)</Text>
                  <Text style={styles.gstAmount}>+₹{priceCalculation.gstAmount.toFixed(2)}</Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(500).duration(600)} style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Icon name="inventory" size={24} color={colors.primary} />
                  <Text style={styles.statValue}>{product.quantity || 0}</Text>
                  <Text style={styles.statLabel}>In Stock</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="category" size={24} color={colors.secondary} />
                  <Text style={styles.statValue} numberOfLines={1}>{product.category}</Text>
                  <Text style={styles.statLabel}>Category</Text>
                </View>
                <View style={styles.statItem}>
                  <Icon name="update" size={24} color={colors.text.secondary} />
                  <Text style={styles.statValue}>
                    {new Date(product.updatedAt || Date.now()).toLocaleDateString()}
                  </Text>
                  <Text style={styles.statLabel}>Updated</Text>
                </View>
              </Animated.View>

              {product.details && (
                <Animated.View entering={FadeInDown.delay(600).duration(600)} style={styles.detailsSection}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.detailsText}>{product.details}</Text>
                </Animated.View>
              )}

              <Animated.View entering={FadeInDown.delay(700).duration(600)} style={styles.actionsSection}>
                <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.actionButton}>
                  <Icon name="edit" size={24} color={colors.primary} />
                  <Text style={styles.actionButtonText}>Edit Details</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDelete} style={[styles.actionButton, styles.deleteButton]}>
                  <Icon name="delete" size={24} color={colors.error} />
                  <Text style={[styles.actionButtonText, { color: colors.error }]}>Delete Product</Text>
                </TouchableOpacity>
              </Animated.View>
            </>
          )}
        </View>
      </Animated.ScrollView>

      {/* Image Modal */}
      <Modal visible={imageModalVisible} transparent={true} onRequestClose={() => setImageModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalClose} onPress={() => setImageModalVisible(false)}>
            <Icon name="close" size={30} color="#FFF" />
          </TouchableOpacity>
          <Image
            source={imageUri ? { uri: imageUri } : require('../assets/placeholder.png')}
            style={styles.modalImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  collapsedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: COLLAPSED_HEADER_HEIGHT,
    backgroundColor: colors.primary,
    zIndex: 100,
    elevation: 4,
    justifyContent: 'flex-end',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.inverse,
    flex: 1,
    marginLeft: 16,
  },
  backButton: {
    padding: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAction: {
    padding: 4,
    marginLeft: 16,
  },
  floatingBackButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 16,
    zIndex: 90,
  },
  roundButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  imageContainer: {
    height: HEADER_HEIGHT,
    width: WINDOW_WIDTH,
    justifyContent: 'flex-end',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    width: WINDOW_WIDTH,
    height: HEADER_HEIGHT,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    backgroundImage: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))',
  },
  heroContent: {
    padding: 20,
    paddingBottom: 30,
  },
  heroCategory: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 12,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 20,
    minHeight: WINDOW_HEIGHT - HEADER_HEIGHT + 20,
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  finalPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
  },
  originalPrice: {
    fontSize: 16,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
    marginTop: 4,
  },
  gstInfo: {
    alignItems: 'flex-end',
  },
  gstLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  gstAmount: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  statsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  detailsText: {
    fontSize: 16,
    color: colors.text.secondary,
    lineHeight: 24,
  },
  actionsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  deleteButton: {
    borderColor: colors.error,
    backgroundColor: 'rgba(255, 0, 0, 0.05)',
  },
  formSection: {
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  picker: {
    color: colors.text.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  imagePickerText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  modalImage: {
    width: '100%',
    height: '80%',
  },
});

export default ProductDetailScreen;