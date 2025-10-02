import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

import { RootStackParamList } from '../navigation/AppNavigator';
import DatabaseService, { Product } from '../database/DatabaseService';
import { colors } from '../theme/colors';

type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;
type ProductDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ProductDetail'>;

const CATEGORIES = [
  'Electronics',
  'Clothing',
  'Home & Kitchen',
  'Books',
  'Toys & Games',
  'Beauty & Personal Care',
  'Sports & Outdoors',
  'Automotive',
  'Office Supplies',
  'Other',
];

const GST_SLABS = [0, 5, 12, 18, 28];

const ProductDetailScreen = () => {
  const route = useRoute<ProductDetailScreenRouteProp>();
  const navigation = useNavigation<ProductDetailScreenNavigationProp>();
  const { productId } = route.params;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
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

  const loadProduct = async () => {
    try {
      setLoading(true);
      const productData = await DatabaseService.getProductById(productId);
      
      if (productData) {
        setProduct(productData);
        // Initialize form fields
        setName(productData.name);
        setCategory(productData.category);
        setPrice(productData.price.toString());
        setQuantity(productData.quantity?.toString() || '0');
        setDiscountPrice(productData.discountPrice?.toString() || '');
        setGstSlab(productData.gstSlab || GST_SLABS[0]);
        setDetails(productData.details || '');
        setImageUri(productData.imageUri);
      } else {
        Alert.alert('Error', 'Product not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      name: '',
      price: '',
      discountPrice: '',
    };

    // Validate name
    if (!name.trim()) {
      newErrors.name = 'Product name is required';
      isValid = false;
    }

    // Validate price
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

    // Validate discount price if provided
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

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      
      const updatedProduct: Product = {
        id: productId,
        name,
        category,
        price: parseFloat(price),
        quantity: quantity ? parseInt(quantity) : 0,
        discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
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
      Alert.alert('Error', 'Failed to update product. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this product? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: confirmDelete 
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      await DatabaseService.deleteProduct(productId);
      Alert.alert('Success', 'Product deleted successfully');
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting product:', error);
      Alert.alert('Error', 'Failed to delete product. Please try again.');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const renderViewMode = () => {
    if (!product) return null;

    const discountPercentage = product.discountPrice
      ? Math.round(((product.price - product.discountPrice) / product.price) * 100)
      : 0;

    return (
      <View style={styles.detailsContainer}>
        {product.imageUri && (
          <Image
            source={{ uri: product.imageUri }}
            style={styles.productImage}
          />
        )}
        <View style={styles.header}>
          <Text style={styles.productName}>{product.name}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{product.category}</Text>
          </View>
        </View>

        <View style={styles.priceSection}>
          {product.discountPrice ? (
            <View style={styles.priceContainer}>
              <Text style={styles.originalPrice}>${product.price.toFixed(2)}</Text>
              <Text style={styles.discountPrice}>${product.discountPrice.toFixed(2)}</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{discountPercentage}% OFF</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
          )}
        </View>

        <View style={styles.quantitySection}>
          <Text style={styles.sectionTitle}>Inventory Information</Text>
          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity:</Text>
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityText}>{product.quantity || 0} units</Text>
            </View>
          </View>
        </View>

        <View style={styles.gstSection}>
          <Text style={styles.sectionTitle}>GST Information</Text>
          <View style={styles.gstContainer}>
            <Text style={styles.gstLabel}>GST Slab:</Text>
            <View style={styles.gstBadge}>
              <Text style={styles.gstText}>{product.gstSlab || 0}%</Text>
            </View>
          </View>
        </View>

        {product.details && (
          <View style={styles.detailsSection}>
            <Text style={styles.sectionTitle}>Product Details</Text>
            <Text style={styles.detailsText}>{product.details}</Text>
          </View>
        )}

        <View style={styles.metadataSection}>
          <Text style={styles.metadataLabel}>Added on:</Text>
          <Text style={styles.metadataValue}>
            {product.createdAt ? new Date(product.createdAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'Not available'}
          </Text>
          {product.updatedAt && product.updatedAt !== product.createdAt && (
            <>
              <Text style={styles.metadataLabel}>Last updated:</Text>
              <Text style={styles.metadataValue}>
                {new Date(product.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </>
          )}
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => setIsEditing(true)}
          >
            <Icon name="edit" size={20} color={colors.text.inverse} />
            <Text style={styles.actionButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDelete}
          >
            <Icon name="delete" size={20} color={colors.text.inverse} />
            <Text style={styles.actionButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const pickImage = () => {
    Alert.alert(
      'Select Image Source',
      'Choose where to get the image from',
      [
        {
          text: 'Camera',
          onPress: () => {
            launchCamera({ mediaType: 'photo', includeBase64: false }, (response) => {
              if (response.didCancel) {
                console.log('User cancelled camera');
              } else if (response.errorCode) {
                Alert.alert('Error', response.errorMessage || 'Something went wrong');
              } else if (response.assets && response.assets[0].uri) {
                setImageUri(response.assets[0].uri);
              }
            });
          },
        },
        {
          text: 'Gallery',
          onPress: () => {
            launchImageLibrary({ mediaType: 'photo', includeBase64: false }, (response) => {
              if (response.didCancel) {
                console.log('User cancelled gallery');
              } else if (response.errorCode) {
                Alert.alert('Error', response.errorMessage || 'Something went wrong');
              } else if (response.assets && response.assets[0].uri) {
                setImageUri(response.assets[0].uri);
              }
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderEditMode = () => {
    return (
      <View style={styles.formContainer}>
        <Text style={styles.label}>Product Image</Text>
        <TouchableOpacity
          style={styles.imagePicker}
          onPress={pickImage}
        >
          <Icon name="add-photo-alternate" size={24} color={colors.primary} />
          <Text style={styles.imagePickerText}>
            {imageUri ? 'Change Image' : 'Add Product Image'}
          </Text>
        </TouchableOpacity>
        {imageUri && (
          <Image
            source={{ uri: imageUri }}
            style={styles.imagePreview}
          />
        )}

        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={[styles.input, errors.name ? styles.inputError : null]}
          value={name}
          onChangeText={setName}
          placeholder="Enter product name"
        />
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

        <Text style={styles.label}>Category *</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={category}
            onValueChange={(itemValue) => setCategory(itemValue)}
            style={styles.picker}
          >
            {CATEGORIES.map((cat) => (
              <Picker.Item key={cat} label={cat} value={cat} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Price ($) *</Text>
        <TextInput
          style={[styles.input, errors.price ? styles.inputError : null]}
          value={price}
          onChangeText={setPrice}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}

        <Text style={styles.label}>Quantity</Text>
        <TextInput
          style={styles.input}
          value={quantity}
          onChangeText={setQuantity}
          placeholder="0"
          keyboardType="number-pad"
        />

        <Text style={styles.label}>Discount Price ($)</Text>
        <TextInput
          style={[styles.input, errors.discountPrice ? styles.inputError : null]}
          value={discountPrice}
          onChangeText={setDiscountPrice}
          placeholder="0.00"
          keyboardType="decimal-pad"
        />
        {errors.discountPrice ? <Text style={styles.errorText}>{errors.discountPrice}</Text> : null}

        <Text style={styles.label}>GST Slab (%)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={gstSlab}
            onValueChange={(itemValue) => setGstSlab(itemValue)}
            style={styles.picker}
          >
            {GST_SLABS.map((slab) => (
              <Picker.Item key={slab} label={`${slab}%`} value={slab} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Additional Details</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={details}
          onChangeText={setDetails}
          placeholder="Enter product details, specifications, etc."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <View style={styles.editActionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.cancelButton]}
            onPress={() => {
              // Reset form to original values
              if (product) {
                setName(product.name);
                setCategory(product.category);
                setPrice(product.price.toString());
                setQuantity(product.quantity?.toString() || '0');
                setDiscountPrice(product.discountPrice?.toString() || '');
                setGstSlab(product.gstSlab || GST_SLABS[0]);
                setDetails(product.details || '');
                setImageUri(product.imageUri);
              }
              setIsEditing(false);
            }}
            disabled={isSaving}
          >
            <Icon name="close" size={20} color={colors.text.inverse} />
            <Text style={styles.actionButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.saveButton]}
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.text.inverse} />
            ) : (
              <>
                <Icon name="check" size={20} color={colors.text.inverse} />
                <Text style={styles.actionButtonText}>Save</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {isEditing ? renderEditMode() : renderViewMode()}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  categoryText: {
    color: colors.text.inverse,
    fontWeight: '500',
    fontSize: 14,
  },
  priceSection: {
    marginBottom: 24,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  originalPrice: {
    fontSize: 18,
    color: colors.text.secondary,
    textDecorationLine: 'line-through',
    marginRight: 12,
  },
  discountPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.accent,
    marginRight: 12,
  },
  discountBadge: {
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: 'bold',
  },
  quantitySection: {
    marginBottom: 24,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityLabel: {
    fontSize: 16,
    color: colors.text.primary,
    marginRight: 12,
  },
  quantityBadge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quantityText: {
    color: colors.text.inverse,
    fontWeight: '500',
    fontSize: 14,
  },
  gstSection: {
    marginBottom: 24,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gstContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  gstLabel: {
    fontSize: 16,
    color: colors.text.primary,
    marginRight: 12,
  },
  gstBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  gstText: {
    color: colors.text.inverse,
    fontWeight: '500',
    fontSize: 14,
  },
  detailsSection: {
    marginBottom: 24,
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },
  detailsText: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
  },
  metadataSection: {
    marginBottom: 24,
  },
  metadataLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 14,
    color: colors.text.primary,
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
  },
  editButton: {
    backgroundColor: colors.primary,
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: colors.error,
    marginLeft: 8,
  },
  actionButtonText: {
    color: colors.text.inverse,
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  // Edit mode styles
  formContainer: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  textArea: {
    minHeight: 100,
  },
  editActionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 24,
  },
  cancelButton: {
    backgroundColor: colors.text.secondary,
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: colors.success,
    marginLeft: 8,
  },
  productImage: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 16,
  },
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 16,
  },
  imagePickerText: {
    marginLeft: 8,
    color: colors.primary,
    fontSize: 16,
  },
  imagePreview: {
    width: 200,
    height: 200,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 16,
  },
});

export default ProductDetailScreen;