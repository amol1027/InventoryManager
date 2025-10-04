import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';

import DatabaseService from '../database/DatabaseService';
import { useTheme } from '../theme/ThemeContext';

const GST_SLABS = [0, 5, 12, 18, 28];

const AddItemScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [discountPrice, setDiscountPrice] = useState('');
  const [gstSlab, setGstSlab] = useState<number>(GST_SLABS[0]);
  const [details, setDetails] = useState('');
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    name: '',
    price: '',
    discountPrice: '',
  });

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        await DatabaseService.initDatabase();

        // Try to get categories from the categories table first
        let categoriesList = await DatabaseService.getAllCategories();

        if (categoriesList.length === 0) {
          // If no categories exist, initialize with only "Others" and reload
          await initializeDefaultCategories();
          categoriesList = await DatabaseService.getAllCategories();
        }

        const categoryNames = categoriesList.map(cat => cat.name);

        // Sort categories alphabetically
        categoryNames.sort();

        setCategories(categoryNames);

        // Set default category if categories exist
        if (categoryNames.length > 0) {
          setCategory(categoryNames[0]);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        Alert.alert('Error', 'Failed to load categories');
        // Fallback to only "Others" category if database fails
        setCategories(['Others']);
        setCategory('Others');
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const initializeDefaultCategories = async () => {
    try {
      // Check if "Others" category already exists
      const existingCategories = await DatabaseService.getAllCategories();
      const othersExists = existingCategories.some(cat => cat.name.toLowerCase() === 'others');

      if (!othersExists) {
        // Only create the 'Others' category as the single default category
        await DatabaseService.addCategory({ name: 'Others' });
        console.log('Default "Others" category initialized in AddItemScreen');
      }
    } catch (error) {
      console.error('Error initializing default categories:', error);
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

    // Validate quantity
    if (!quantity.trim()) {
      // Quantity is optional, but if provided, validate it
    } else {
      const quantityValue = parseInt(quantity, 10);
      if (isNaN(quantityValue) || quantityValue < 0) {
        // For now, we'll allow 0 or positive quantities
        // You can add more specific validation if needed
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

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const productData = {
        name,
        category,
        price: parseFloat(price),
        quantity: quantity && quantity.trim() ? parseInt(quantity, 10) : 0,
        discountPrice: discountPrice && discountPrice.trim() ? parseFloat(discountPrice) : undefined,
        gstSlab,
        details: details.trim() || undefined,
        imageUri,
      };

      await DatabaseService.addProduct(productData);
      
      Alert.alert(
        'Success',
        'Product added successfully',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error adding product:', error);
      Alert.alert('Error', 'Failed to add product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
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
          {loadingCategories ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : (
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) => setCategory(itemValue)}
              style={styles.picker}
            >
              {categories.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          )}
        </View>

        <Text style={styles.label}>Price (₹) *</Text>
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

        <Text style={styles.label}>Discount Price (₹)</Text>
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

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={colors.text.inverse} />
          ) : (
            <>
              <Icon name="add-circle-outline" size={20} color={colors.text.inverse} />
              <Text style={styles.submitButtonText}>Add Product</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
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
    backgroundColor: colors.surface,
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
  imagePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  imagePickerText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.text.primary,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: colors.text.inverse,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 16,
  },
});

export default AddItemScreen;