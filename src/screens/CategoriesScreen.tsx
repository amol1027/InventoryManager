import React, { useState, useEffect, useLayoutEffect } from 'react';
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
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { RootDrawerParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import DatabaseService, { Category } from '../database/DatabaseService';
import { ErrorHandler, DatabaseErrorHandler } from '../utils/ErrorHandler';
import { ConfirmationDialog } from '../utils/ConfirmationDialog';

interface CategoryWithCount extends Category {
  count: number;
}

type CategoriesScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Categories'>;

const CategoriesScreen = () => {
  const navigation = useNavigation<CategoriesScreenNavigationProp>();
  const { colors } = useTheme();
  const styles = getStyles(colors);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  // Configure native header
  useLayoutEffect(() => {
    (navigation as any).setOptions({
      title: 'Categories',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            try {
              // Try multiple methods to access drawer
              const parent = (navigation as any).getParent?.();
              if (parent?.dispatch) {
                parent.dispatch(DrawerActions.toggleDrawer());
              } else if ((navigation as any).dispatch) {
                (navigation as any).dispatch(DrawerActions.toggleDrawer());
              } else {
                // Fallback: try to access drawer through root navigation
                const root = (navigation as any).getRootState?.();
                if (root?.routes?.[0]?.state) {
                  (navigation as any).dispatch(DrawerActions.toggleDrawer());
                }
              }
            } catch (error) {
              console.error('Error toggling drawer:', error);
            }
          }}
          style={{ paddingHorizontal: 8 }}
        >
          <Icon name="menu" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{ paddingHorizontal: 8 }}
        >
          <Icon name="add" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.text.inverse]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      await DatabaseService.initDatabase();

      // Initialize with default categories if none exist
      await initializeDefaultCategories();

      const categoriesWithCount = await DatabaseService.getCategoriesWithProductCount();
      setCategories(categoriesWithCount);
      setFilteredCategories(categoriesWithCount);
    } catch (error) {
      ErrorHandler.handle(
        DatabaseErrorHandler.createDatabaseError('Failed to load categories', error as Error),
        'CategoriesScreen.loadCategories'
      );
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultCategories = async () => {
    try {
      const existingCategories = await DatabaseService.getAllCategories();

      if (existingCategories.length === 0) {
        // Only create the 'Others' category as the single default category
        await DatabaseService.addCategory({ name: 'Others' });
        console.log('Default "Others" category initialized');
      }
    } catch (error) {
      console.error('Error initializing default categories:', error);
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
      // Add category to database
      await DatabaseService.addCategory({ name: trimmedCategory });

      // Refresh categories from database
      const updatedCategories = await DatabaseService.getCategoriesWithProductCount();
      setCategories(updatedCategories);
      setFilteredCategories(updatedCategories);

      setModalVisible(false);
      setNewCategoryName('');
      Alert.alert('Success', `Category "${trimmedCategory}" added successfully`);
    } catch (error) {
      ErrorHandler.handle(
        DatabaseErrorHandler.createDatabaseError('Failed to add category', error as Error),
        'CategoriesScreen.handleAddCategory'
      );
    }
  };

  const ensureOthersCategoryExists = async (): Promise<number> => {
    // Check if 'Others' category exists
    const allCategories = await DatabaseService.getAllCategories();
    const othersCategory = allCategories.find((cat: { name: string; }) => cat.name.toLowerCase() === 'others');
    
    if (othersCategory) {
      return othersCategory.id!;
    }
    
    // Create 'Others' category if it doesn't exist
    const newCategoryId = await DatabaseService.addCategory({ name: 'Others' });
    return newCategoryId;
  };

  const handleDeleteCategory = (category: CategoryWithCount) => {
    if (category.count > 0) {
      // If category has products, ask if user wants to move them to 'Others' category
      Alert.alert(
        'Category Contains Products',
        `"${category.name}" contains ${category.count} product(s). Move these products to 'Others' category and delete?`,
        [
          { 
            text: 'Cancel', 
            style: 'cancel' 
          },
          { 
            text: 'Move & Delete',
            onPress: async () => {
              try {
                const othersCategoryId = await ensureOthersCategoryExists();
                
                // Move all products to 'Others' category
                await DatabaseService.executeSql(
                  'UPDATE products SET category = ? WHERE category = ?',
                  ['Others', category.name]
                );
                
                // Now delete the category
                await DatabaseService.deleteCategory(category.id!);
                
                // Refresh the categories list
                const updatedCategories = await DatabaseService.getCategoriesWithProductCount();
                setCategories(updatedCategories);
                setFilteredCategories(updatedCategories);
                
                Alert.alert('Success', `Moved ${category.count} product(s) to 'Others' and deleted category.`);
              } catch (error) {
                ErrorHandler.handle(
                  DatabaseErrorHandler.createDatabaseError('Failed to move products and delete category', error as Error),
                  'CategoriesScreen.handleDeleteCategory'
                );
              }
            } 
          }
        ]
      );
      return;
    }

    // If category is empty, proceed with direct deletion
    ConfirmationDialog.show(
      {
        title: 'Delete Category',
        message: `Are you sure you want to delete the category "${category.name}"?`,
        confirmText: 'Delete',
      },
      async () => {
        try {
          await DatabaseService.deleteCategory(category.id!);
          const updatedCategories = await DatabaseService.getCategoriesWithProductCount();
          setCategories(updatedCategories);
          setFilteredCategories(updatedCategories);
          Alert.alert('Success', 'Category deleted successfully');
        } catch (error) {
          ErrorHandler.handle(
            DatabaseErrorHandler.createDatabaseError('Failed to delete category', error as Error),
            'CategoriesScreen.handleDeleteCategory'
          );
        }
      }
    );
  };

  const renderCategoryItem = ({ item }: { item: CategoryWithCount }) => (
    <View style={styles.categoryItem}>
      <TouchableOpacity
        style={styles.categoryContent}
        onPress={() => {
          try {
            console.log('Navigating to CategoryProducts with category:', item.name);
            // Close drawer first, then navigate to MainStack, then to CategoryProducts
            navigation.closeDrawer();
            setTimeout(() => {
              (navigation as any).navigate('MainStack', {
                screen: 'CategoryProducts',
                params: { categoryName: item.name }
              });
            }, 100);
          } catch (error) {
            ErrorHandler.handle(error as Error, 'CategoriesScreen.renderCategoryItem', true);
          }
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
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteCategory(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="delete" size={22} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header handled by native navigation */}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color={colors.text.secondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search categories..."
          placeholderTextColor={colors.text.disabled}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => setSearchQuery('')}
          >
            <Icon name="clear" size={20} color={colors.text.secondary} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      ) : (
        <>
          {filteredCategories.length === 0 && searchQuery.trim() !== '' ? (
            <View style={styles.noResultsContainer}>
              <Icon name="search-off" size={48} color={colors.text.disabled} />
              <Text style={styles.noResultsText}>No categories found</Text>
              <Text style={styles.noResultsSubtext}>
                Try adjusting your search terms
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredCategories}
              renderItem={renderCategoryItem}
              keyExtractor={(item) => item.name}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          )}
        </>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    margin: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
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
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 4,
    overflow: 'hidden',
  },
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  deleteButton: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
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
});

export default CategoriesScreen;
