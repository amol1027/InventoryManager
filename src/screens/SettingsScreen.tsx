import React from 'react';
import { View, Text, Switch } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';

const SettingsScreen = () => {
  const { theme, colors, toggleTheme } = useTheme();
  const isDarkMode = theme === 'dark';

  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold' as const,
      color: colors.text.primary,
      marginLeft: 12,
    },
    content: {
      flex: 1,
      padding: 20,
    },
    themeOption: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    themeInfo: {
      flex: 1,
      marginRight: 16,
    },
    themeTitle: {
      fontSize: 18,
      fontWeight: '600' as const,
      color: colors.text.primary,
      marginBottom: 4,
    },
    themeDescription: {
      fontSize: 14,
      color: colors.text.secondary,
      lineHeight: 20,
    },
    currentTheme: {
      marginBottom: 20,
    },
    currentThemeTitle: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: colors.text.primary,
      marginBottom: 12,
    },
    themePreview: {
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center' as const,
    },
    themePreviewDark: {
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center' as const,
      backgroundColor: '#1a1a1a',
    },
    themePreviewText: {
      fontSize: 16,
      fontWeight: '500' as const,
    },
    themePreviewTextDark: {
      fontSize: 16,
      fontWeight: '500' as const,
      color: '#ffffff',
    },
    note: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    noteText: {
      fontSize: 14,
      color: colors.text.secondary,
      marginLeft: 8,
      lineHeight: 20,
    },
  };

  return (
    <View style={dynamicStyles.container}>
      <View style={dynamicStyles.header}>
        <Icon name="brightness-6" size={28} color={colors.primary} />
        <Text style={dynamicStyles.title}>Theme Settings</Text>
      </View>

      <View style={dynamicStyles.content}>
        <View style={dynamicStyles.themeOption}>
          <View style={dynamicStyles.themeInfo}>
            <Text style={dynamicStyles.themeTitle}>
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </Text>
            <Text style={dynamicStyles.themeDescription}>
              {isDarkMode
                ? 'Dark theme for comfortable viewing in low light'
                : 'Light theme for bright environments'
              }
            </Text>
          </View>
          <Switch
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{
              false: colors.border,
              true: colors.primary
            }}
            thumbColor={isDarkMode ? colors.secondary : '#f4f3f4'}
          />
        </View>

        <View style={dynamicStyles.currentTheme}>
          <Text style={dynamicStyles.currentThemeTitle}>Current Theme</Text>
          <View style={isDarkMode ? dynamicStyles.themePreviewDark : dynamicStyles.themePreview}>
            <Text style={isDarkMode ? dynamicStyles.themePreviewTextDark : dynamicStyles.themePreviewText}>
              {isDarkMode ? 'Dark Mode Active' : 'Light Mode Active'}
            </Text>
          </View>
        </View>

        <View style={dynamicStyles.note}>
          <Icon name="info" size={20} color={colors.text.secondary} />
          <Text style={dynamicStyles.noteText}>
            Theme changes are applied immediately across the entire app.
          </Text>
        </View>
      </View>
    </View>
  );
};

export default SettingsScreen;