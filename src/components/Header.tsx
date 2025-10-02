import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { colors } from '../theme/colors';

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

  return (
    <View style={styles.container}>
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
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
          >
            <Icon name="menu" size={24} color={colors.text.primary} />
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={styles.rightContainer}>
        {rightComponent || <View style={styles.placeholder} />}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
  },
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
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
  },
  iconButton: {
    padding: 8,
  },
  placeholder: {
    width: 24,
  },
});

export default Header;