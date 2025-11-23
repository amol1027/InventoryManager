import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { ErrorBoundary } from '../components/ErrorBoundary';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import AddItemScreen from '../screens/AddItemScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import CategoryProductsScreen from '../screens/CategoryProductsScreen';

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
  CategoryProducts: { categoryName: string; from?: string };
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

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