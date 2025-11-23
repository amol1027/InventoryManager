import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

import DatabaseService from '../database/DatabaseService';
import { useTheme } from '../theme/ThemeContext';

const GST_SLABS = [0, 5, 12, 18, 28];

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  formContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
    marginTop: 16,
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
  halfWidth: {
    width: '48%',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  imagePicker: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imagePlaceholder: {
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: colors.text.secondary,
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
});

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

        let categoriesList = await DatabaseService.getAllCategories();

        if (categoriesList.length === 0) {
          await initializeDefaultCategories();
          categoriesList = await DatabaseService.getAllCategories();
        }

        const categoryNames = categoriesList.map(cat => cat.name);
        categoryNames.sort();
        setCategories(categoryNames);

        if (categoryNames.length > 0) {
          setCategory(categoryNames[0]);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        Alert.alert('Error', 'Failed to load categories');
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
      const existingCategories = await DatabaseService.getAllCategories();
      const othersExists = existingCategories.some(cat => cat.name.toLowerCase() === 'others');

      if (!othersExists) {
        await DatabaseService.addCategory({ name: 'Others' });
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
    <View style={styles.container}>
      <Reanimated.ScrollView
        contentContainerStyle={styles.formContainer}
        entering={FadeInDown.duration(600).springify()}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.label}>Product Name *</Text>
        <TextInput
          style={[styles.input, errors.name ? { borderColor: colors.error } : null]}
          value={name}
          onChangeText={setName}
          placeholder="Enter product name"
          placeholderTextColor={colors.text.disabled}
        />
        {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}

        <Text style={styles.label}>Category</Text>
        <View style={styles.pickerContainer}>
          {loadingCategories ? (
            <ActivityIndicator size="small" color={colors.primary} style={{ padding: 14 }} />
          ) : (
            <Picker
              selectedValue={category}
              onValueChange={(itemValue) => setCategory(itemValue)}
              style={styles.picker}
              dropdownIconColor={colors.text.primary}
            >
              {categories.map((cat) => (
                <Picker.Item key={cat} label={cat} value={cat} />
              ))}
            </Picker>
          )}
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Price (₹) *</Text>
            <TextInput
              style={[styles.input, errors.price ? { borderColor: colors.error } : null]}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              placeholderTextColor={colors.text.disabled}
              keyboardType="numeric"
            />
            {errors.price ? <Text style={styles.errorText}>{errors.price}</Text> : null}
          </View>

          <View style={styles.halfWidth}>
            <Text style={styles.label}>Quantity</Text>
            <TextInput
              style={styles.input}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="0"
              placeholderTextColor={colors.text.disabled}
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfWidth}>
            <Text style={styles.label}>Discount Price (₹)</Text>
            <TextInput
              style={[styles.input, errors.discountPrice ? { borderColor: colors.error } : null]}
              value={discountPrice}
              onChangeText={setDiscountPrice}
              placeholder="Optional"
              placeholderTextColor={colors.text.disabled}
              keyboardType="numeric"
            />
            {errors.discountPrice ? <Text style={styles.errorText}>{errors.discountPrice}</Text> : null}
          </View>

          <View style={styles.halfWidth}>
            <Text style={styles.label}>GST Slab (%)</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={gstSlab}
                onValueChange={(itemValue) => setGstSlab(itemValue)}
                style={styles.picker}
                dropdownIconColor={colors.text.primary}
              >
                {GST_SLABS.map((slab) => (
                  <Picker.Item key={slab} label={`${slab}%`} value={slab} />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={details}
          onChangeText={setDetails}
          placeholder="Enter product details..."
          placeholderTextColor={colors.text.disabled}
          multiline
          numberOfLines={4}
        />

        <Text style={styles.label}>Product Image</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Icon name="add-a-photo" size={40} color={colors.text.secondary} />
              <Text style={styles.imagePlaceholderText}>Tap to add image</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Add Product</Text>
          )}
        </TouchableOpacity>
      </Reanimated.ScrollView>
    </View>
  );
};

export default AddItemScreen;