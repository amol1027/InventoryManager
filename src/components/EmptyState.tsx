import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';

interface EmptyStateProps {
  icon?: string;
  title: string;
  message: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'inventory',
  title,
  message,
}) => {
  const { colors } = useTheme();

  const dynamicStyles = {
    title: {
      fontSize: 20,
      fontWeight: 'bold' as const,
      color: colors.text.primary,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center' as const,
    },
    message: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center' as const,
      lineHeight: 22,
    },
  };

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
        <Icon name={icon} size={64} color={colors.text.disabled} />
      </View>
      <Text style={dynamicStyles.title}>{title}</Text>
      <Text style={dynamicStyles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
});

export default EmptyState;