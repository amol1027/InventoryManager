import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  BackHandler,
} from 'react-native';
import {
  DrawerContentScrollView,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';

const CustomDrawerContent: React.FC<DrawerContentComponentProps> = (props) => {
  const { navigation, state } = props;
  const { colors } = useTheme();

  const handleExit = () => {
    Alert.alert(
      'Exit App',
      'Are you sure you want to exit?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: () => BackHandler.exitApp(),
        },
      ]
    );
  };

  const drawerItems = [
    {
      label: 'Home',
      icon: 'home',
      screen: 'MainStack',
    },
    {
      label: 'Categories',
      icon: 'category',
      screen: 'Categories',
    },
    {
      label: 'Theme',
      icon: 'brightness-6',
      screen: 'Settings',
    },
    {
      label: 'About',
      icon: 'info',
      screen: 'About',
    },
  ];

  const styles = createStyles(colors);

  return (
    <DrawerContentScrollView {...props} style={styles.container}>
      {/* App Header */}
      <View style={styles.header}>
        <Icon name="inventory" size={32} color={colors.primary} />
        <Text style={styles.appName}>Vinayak Agencies</Text>
        <Text style={styles.version}>v1.2.4</Text>
      </View>

      {/* Drawer Items */}
      <View style={styles.menuItems}>
        {drawerItems.map((item, index) => {
          const isActive = state.routeNames[state.index] === item.screen;
          console.log(`Drawer item: ${item.label}, screen: ${item.screen}, isActive: ${isActive}, current route: ${state.routeNames[state.index]}`);

          return (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, isActive && styles.activeMenuItem]}
              onPress={() => {
                console.log('Drawer navigation to:', item.screen, 'Current state:', state.routeNames[state.index]);
                if (item.screen === 'MainStack') {
                  // For Home, navigate to MainStack and reset the stack
                  navigation.reset({
                    index: 0,
                    routes: [{ name: 'MainStack' }],
                  });
                } else {
                  // For other screens, navigate normally
                  try {
                    navigation.navigate(item.screen as never);
                  } catch (error) {
                    console.error('Error navigating from drawer:', error);
                  }
                }
              }}
            >
              <Icon
                name={item.icon}
                size={24}
                color={isActive ? colors.primary : colors.text.secondary}
              />
              <Text style={[styles.menuText, isActive && styles.activeMenuText]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Exit Button */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
          <Icon name="exit-to-app" size={24} color={colors.error} />
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
      </View>
    </DrawerContentScrollView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'center',
    marginBottom: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginTop: 10,
  },
  version: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  menuItems: {
    flex: 1,
    paddingHorizontal: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 2,
    borderRadius: 8,
  },
  activeMenuItem: {
    backgroundColor: colors.primary + '20', // 20% opacity
  },
  menuText: {
    fontSize: 16,
    marginLeft: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  activeMenuText: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: colors.error + '10', // 10% opacity
  },
  exitText: {
    fontSize: 16,
    marginLeft: 16,
    color: colors.error,
    fontWeight: '500',
  },
});

export default CustomDrawerContent;
