import React, { useState, useEffect, useLayoutEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Reanimated, { FadeInDown, Layout } from 'react-native-reanimated';
import { RootDrawerParamList } from '../navigation/AppNavigator';
import { useTheme } from '../theme/ThemeContext';
import DatabaseService, { Category } from '../database/DatabaseService';
import { ErrorHandler, DatabaseErrorHandler } from '../utils/ErrorHandler';
import { ConfirmationDialog } from '../utils/ConfirmationDialog';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

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

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      await DatabaseService.initDatabase();
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
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Configure native header
  useLayoutEffect(() => {
    (navigation as any).setOptions({
      title: 'Categories',
      headerStyle: {
        backgroundColor: colors.surface,
      },
      headerTintColor: colors.text.primary,
      headerTitleStyle: {
        fontWeight: '700',
        fontSize: 20,
      },
      headerShadowVisible: false,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            try {
              const parent = (navigation as any).getParent?.();
              if (parent?.dispatch) {
                parent.dispatch(DrawerActions.toggleDrawer());
              } else if ((navigation as any).dispatch) {
                (navigation as any).dispatch(DrawerActions.toggleDrawer());
              } else {
                const root = (navigation as any).getRootState?.();
                if (root?.routes?.[0]?.state) {
                  (navigation as any).dispatch(DrawerActions.toggleDrawer());
                }
              }
            } catch (error) {
              console.error('Error toggling drawer:', error);
            }
          }}
          style={{ paddingHorizontal: 16 }}
        >
          <Icon name="menu" size={24} color={colors.text.primary} />
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={{ paddingHorizontal: 16 }}
        >
          <View style={[styles.addButtonHeader, { backgroundColor: colors.primary }]}>
            <Icon name="add" size={20} color={colors.text.inverse} />
          </View>
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors, styles.addButtonHeader]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setFilteredCategories(filtered);
    }
  }, [searchQuery, categories]);



  const initializeDefaultCategories = async () => {
    try {
      const existingCategories = await DatabaseService.getAllCategories();
      if (existingCategories.length === 0) {
        await DatabaseService.addCategory({ name: 'Others' });
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

    if (categories.some(cat => cat.name.toLowerCase() === trimmedCategory.toLowerCase())) {
      Alert.alert('Error', 'Category already exists');
      return;
    }

    try {
      await DatabaseService.addCategory({ name: trimmedCategory });
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
    const allCategories = await DatabaseService.getAllCategories();
    const othersCategory = allCategories.find((cat: { name: string; }) => cat.name.toLowerCase() === 'others');

    if (othersCategory) {
      return othersCategory.id!;
    }

    const newCategoryId = await DatabaseService.addCategory({ name: 'Others' });
    return newCategoryId;
  };

  const handleDeleteCategory = (category: CategoryWithCount) => {
    if (category.count > 0) {
      Alert.alert(
        'Category Contains Products',
        `"${category.name}" contains ${category.count} product(s). Move these products to 'Others' category and delete?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Move & Delete',
            onPress: async () => {
              try {
                await ensureOthersCategoryExists();
                await DatabaseService.executeSql(
                  'UPDATE products SET category = ? WHERE category = ?',
                  ['Others', category.name]
                );
                await DatabaseService.deleteCategory(category.id!);
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

  const renderCategoryItem = ({ item, index }: { item: CategoryWithCount, index: number }) => (
    <Reanimated.View
      entering={FadeInDown.delay(index * 50).springify()}
      layout={Layout.springify()}
      style={styles.categoryItem}
    >
      <TouchableOpacity
        style={styles.categoryContent}
        onPress={() => {
          try {
            navigation.closeDrawer();
            setTimeout(() => {
              (navigation as any).navigate('MainStack', {
                screen: 'CategoryProducts',
                params: { categoryName: item.name, from: 'Categories' }
              });
            }, 100);
          } catch (error) {
            ErrorHandler.handle(error as Error, 'CategoriesScreen.renderCategoryItem', true);
          }
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
          <Icon name="category" size={24} color={colors.primary} />
        </View>
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.name}</Text>
          <Text style={styles.categoryCount}>{item.count} products</Text>
        </View>
        <Icon name="chevron-right" size={24} color={colors.text.secondary} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteCategory(item)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Icon name="delete" size={20} color={colors.error} />
      </TouchableOpacity>
    </Reanimated.View>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search categories..."
          placeholderTextColor={colors.text.disabled}
        />
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
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text.primary }]}>Add New Category</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[styles.input, {
                backgroundColor: colors.background,
                borderColor: colors.border,
                color: colors.text.primary
              }]}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Enter category name"
              placeholderTextColor={colors.text.disabled}
              autoCapitalize="words"
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { backgroundColor: colors.background }]}
                onPress={() => {
                  setModalVisible(false);
                  setNewCategoryName('');
                }}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text.primary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.addButtonModal, { backgroundColor: colors.primary }]}
                onPress={handleAddCategory}
              >
                <Text style={[styles.addButtonText, { color: colors.text.inverse }]}>Add Category</Text>
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
  addButtonHeader: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
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
    paddingTop: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  categoryContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  deleteButton: {
    padding: 16,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  categoryCount: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  addButtonModal: {
    elevation: 2,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CategoriesScreen;
