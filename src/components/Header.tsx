import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  showMenuButton?: boolean;
  rightComponent?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBackButton = false,
  showMenuButton = true,
  rightComponent,
}) => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const dynamicStyles = {
    container: {
      height: 56,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 8,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    title: {
      flex: 1,
      fontSize: 20,
      fontWeight: 'bold' as const,
      color: colors.text.primary,
      textAlign: 'center' as const,
    },
  };

  return (
    <View style={dynamicStyles.container}>
      <View style={styles.leftContainer}>
        {showBackButton && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
        {showMenuButton && !showBackButton && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => {
              try {
                // For drawer navigation, direct dispatch should work
                navigation.dispatch(DrawerActions.toggleDrawer());
              } catch (error) {
                console.error('Error toggling drawer:', error);
              }
            }}
          >
            <Icon name="menu" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={dynamicStyles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightContainer}>
        {rightComponent || <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  leftContainer: {
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightContainer: {
    width: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  placeholder: {
    width: 24,
  },
});

export default Header;