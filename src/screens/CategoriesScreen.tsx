import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootDrawerParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import DatabaseService from '../database/DatabaseService';

interface Category {
  name: string;
  count: number;
}

type CategoriesScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Categories'>;

const CategoriesScreen = () => {
  const navigation = useNavigation<CategoriesScreenNavigationProp>();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const products = await DatabaseService.getAllProducts();

      // Group products by category and count them
      const categoryMap = new Map<string, number>();
      products.forEach((product) => {
        const count = categoryMap.get(product.category) || 0;
        categoryMap.set(product.category, count + 1);
      });

      const categoriesData: Category[] = Array.from(categoryMap.entries()).map(
        ([name, count]) => ({
          name,
          count,
        })
      );

      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
      Alert.alert('Error', 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    const trimmedCategory = newCategoryName.trim();

    // Check if category already exists (check against current categories)
    if (categories.some(cat => cat.name.toLowerCase() === trimmedCategory.toLowerCase())) {
      Alert.alert('Error', 'Category already exists');
      return;
    }

    try {
      // For new categories, we'll add a placeholder category with 0 products
      // This allows users to see the category before adding products to it
      const newCategory: Category = {
        name: trimmedCategory,
        count: 0,
      };

      setCategories(prevCategories => [...prevCategories, newCategory]);
      setModalVisible(false);
      setNewCategoryName('');
      Alert.alert('Success', `Category "${trimmedCategory}" added successfully`);
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    }
  };

  const renderCategoryItem = ({ item }: { item: Category }) => (
    <TouchableOpacity
      style={styles.categoryItem}
      onPress={() => {
        console.log('Navigating to CategoryProducts with category:', item.name);
        navigation.navigate('CategoryProducts', { categoryName: item.name });
      }}
    >
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryCount}>{item.count} products</Text>
      </View>
      <View style={[styles.countBadge, { backgroundColor: colors.primary }]}>
        <Text style={styles.countText}>{item.count}</Text>
      </View>
      <Icon name="chevron-right" size={24} color={colors.text.secondary} />
    </TouchableOpacity>
  );

  const predefinedCategories = [
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Categories</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="add" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.name}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Add Category Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Category</Text>

            <TextInput
              style={styles.input}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Enter category name"
              autoCapitalize="words"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setNewCategoryName('');
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal]}
                onPress={handleAddCategory}
              >
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.predefinedTitle}>Predefined Categories:</Text>
            <View style={styles.predefinedContainer}>
              {predefinedCategories.map((category) => {
                const isAlreadyUsed = categories.some(cat => cat.name === category);
                const isSelected = newCategoryName === category;

                return (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.predefinedItem,
                      isAlreadyUsed && styles.usedCategory,
                      isSelected && styles.selectedCategory
                    ]}
                    onPress={() => {
                      if (!isAlreadyUsed) {
                        setNewCategoryName(category);
                      }
                    }}
                    disabled={isAlreadyUsed}
                  >
                    <Text style={[
                      styles.predefinedText,
                      isAlreadyUsed && styles.usedCategoryText,
                      isSelected && styles.selectedCategoryText
                    ]}>
                      {category}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  listContainer: {
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
  },
  categoryCount: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 32,
    alignItems: 'center',
  },
  countText: {
    color: colors.text.inverse,
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text.primary,
    backgroundColor: colors.surface,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: colors.text.secondary,
  },
  cancelButtonText: {
    color: colors.text.inverse,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  addButtonModal: {
    backgroundColor: colors.primary,
  },
  addButtonText: {
    color: colors.text.inverse,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
  },
  predefinedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  predefinedContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  predefinedItem: {
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  usedCategory: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  selectedCategory: {
    backgroundColor: colors.secondary + '20',
    borderColor: colors.secondary,
  },
  predefinedText: {
    fontSize: 14,
    color: colors.text.primary,
  },
  usedCategoryText: {
    color: colors.primary,
    fontWeight: '500',
  },
  selectedCategoryText: {
    color: colors.secondary,
    fontWeight: '500',
  },
});

export default CategoriesScreen;
