import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import AddItemScreen from '../screens/AddItemScreen';
import ProductDetailScreen from '../screens/ProductDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import AboutScreen from '../screens/AboutScreen';

// Import theme
import { colors } from '../theme/colors';

// Define navigation types
export type RootStackParamList = {
  Dashboard: undefined;
  AddItem: undefined;
  ProductDetail: { productId: number };
  Settings: undefined;
  About: undefined;
};

const Drawer = createDrawerNavigator<RootStackParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

const MainStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.text.inverse,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Dashboard" 
        component={DashboardScreen} 
        options={{ title: 'Inventory Dashboard' }} 
      />
      <Stack.Screen 
        name="AddItem" 
        component={AddItemScreen} 
        options={{ title: 'Add New Product' }} 
      />
      <Stack.Screen 
        name="ProductDetail" 
        component={ProductDetailScreen} 
        options={{ title: 'Product Details' }} 
      />
    </Stack.Navigator>
  );
};

const AppNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.text.secondary,
      }}
    >
      <Drawer.Screen 
        name="Dashboard" 
        component={MainStack} 
        options={{ drawerLabel: 'Dashboard' }} 
      />
      <Drawer.Screen 
        name="Settings" 
        component={SettingsScreen} 
        options={{ drawerLabel: 'Settings', headerShown: true }} 
      />
      <Drawer.Screen 
        name="About" 
        component={AboutScreen} 
        options={{ drawerLabel: 'About', headerShown: true }} 
      />
    </Drawer.Navigator>
  );
};

export default AppNavigator;