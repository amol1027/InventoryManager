import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { getHeaderTitle } from '@react-navigation/elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { ErrorHandler } from '../utils/ErrorHandler';
import { ConfirmationDialog } from '../utils/ConfirmationDialog';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import AddItemScreen from '../screens/AddItemScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import CategoryProductsScreen from '../screens/CategoryProductsScreen';

// Import theme
import { colors } from '../theme/colors';

// Import custom drawer content
import CustomDrawerContent from './CustomDrawerContent';

// Define navigation types
export type RootDrawerParamList = {
  MainStack: undefined;
  Categories: undefined;
  Settings: undefined;
  About: undefined;
};

export type RootStackParamList = {
  Dashboard: undefined;
  AddItem: undefined;
  ProductDetail: { productId: number };
  CategoryProducts: { categoryName: string };
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

// Enhanced error handling for navigation
const handleNavigationError = (error: Error) => {
  ErrorHandler.handle(error, 'Navigation', true);
};

// Enhanced drawer item press handler with error handling
const handleDrawerItemPress = async (
  navigation: any,
  routeName: string,
  params?: any
) => {
  try {
    if (params) {
      navigation.navigate(routeName as never, params as never);
    } else {
      navigation.navigate(routeName as never);
    }
  } catch (error) {
    handleNavigationError(error as Error);
  }
};

// Custom header component with menu button and centered title
const CustomHeader = ({ navigation, route, options }: { navigation: any; route: any; options: any }) => {
  const title = getHeaderTitle(options, route.name);
  
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      height: 56,
    }}>
      <TouchableOpacity 
        onPress={navigation.toggleDrawer} 
        style={{
          position: 'absolute',
          left: 16,
          zIndex: 1,
        }}
      >
        <Icon name="menu" size={24} color={colors.text.inverse} />
      </TouchableOpacity>
      <View style={{
        flex: 1,
        alignItems: 'center',
      }}>
        <Text style={{
          color: colors.text.inverse,
          fontSize: 20,
          fontWeight: 'bold',
        }}>
          {title}
        </Text>
      </View>
    </View>
  );
};

const MainStack = () => {
  const { colors } = useTheme();
  return (
    <ErrorBoundary>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.text.inverse,
          headerTitleStyle: {
            fontWeight: 'bold' as const,
          },
        }}
      >
        <Stack.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            title: 'Dashboard',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="AddItem"
          component={AddItemScreen}
          options={{
            title: 'Add Product',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="CategoryProducts"
          component={CategoryProductsScreen}
          options={{
            title: 'Products',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="ProductDetail"
          component={ProductDetailScreen}
          options={{
            title: 'Product Details',
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </ErrorBoundary>
  );
};

const AppNavigator = () => {
  const { colors } = useTheme();

  return (
    <ErrorBoundary>
      <Drawer.Navigator
        initialRouteName="MainStack"
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.text.inverse,
          headerTitleStyle: {
            fontWeight: 'bold' as const,
          },
          drawerActiveTintColor: colors.primary,
          drawerInactiveTintColor: colors.text.secondary,
          drawerStyle: {
            backgroundColor: colors.surface,
            width: 280,
          },
          swipeEnabled: true,
          swipeEdgeWidth: 100,
        }}
      >
        <Drawer.Screen
          name="MainStack"
          component={MainStack}
          options={{
            drawerLabel: 'Home',
            title: 'Dashboard',
            headerShown: false, // MainStack handles its own header
          }}
        />
        <Drawer.Screen
          name="Categories"
          component={CategoriesScreen}
          options={{
            drawerLabel: 'Categories',
            title: 'Categories',
          }}
        />
        <Drawer.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            drawerLabel: 'Theme',
            title: 'Settings',
          }}
        />
        <Drawer.Screen
          name="About"
          component={AboutScreen}
          options={{
            drawerLabel: 'About',
            title: 'About',
          }}
        />
      </Drawer.Navigator>
    </ErrorBoundary>
  );
};

export default AppNavigator;