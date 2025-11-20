import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, StatusBar } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const SplashScreen = () => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // Show for 3 seconds minimum

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) {
    return null; // Hide splash screen when done
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      {/* App Logo/Icon */}
      <View style={styles.logoContainer}>
        <Text style={styles.logoIcon}>🏪</Text>
      </View>

      {/* App Name */}
      <Text style={[styles.appName, { color: colors.text.inverse }]}>
        Vinayak Agencies
      </Text>

      {/* Loading Indicator */}
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.text.inverse} />
        <Text style={[styles.loadingText, { color: colors.text.inverse }]}>
          Loading...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoIcon: {
    fontSize: 80,
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 10,
    opacity: 0.8,
  },
});

export default SplashScreen;
