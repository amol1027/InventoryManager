/**
 * Vinayak Agencies App
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import DatabaseService from './src/database/DatabaseService';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import SplashScreen from './src/components/SplashScreen';

const AppContent = () => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const backgroundStyle = {
    backgroundColor: colors.background,
  };

  useEffect(() => {
    const initDatabase = async () => {
      try {
        await DatabaseService.initDatabase();
        console.log('Database initialized successfully');
        // Add a small delay to ensure smooth transition
        setTimeout(() => {
          setIsLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        setIsLoading(false);
      }
    };

    initDatabase();
  }, []);

  // Show splash screen while loading
  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <StatusBar
          barStyle={colors.text.primary === '#F7FAFC' ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
