import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

interface LoadingIndicatorProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Loading...',
  fullScreen = false,
}) => {
  return (
    <View style={[styles.container, fullScreen && styles.fullScreen]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  message: {
    marginTop: 12,
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default LoadingIndicator;