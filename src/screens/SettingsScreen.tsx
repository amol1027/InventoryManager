import React, { useLayoutEffect } from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, DrawerActions } from '@react-navigation/native';

const SettingsScreen = () => {
  const { theme, colors, toggleTheme } = useTheme();
  const navigation = useNavigation();
  const isDarkMode = theme === 'dark';

  useLayoutEffect(() => {
    (navigation as any).setOptions({
      title: 'Settings',
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => {
            try {
              // Try multiple methods to access drawer
              const parent = (navigation as any).getParent?.();
              if (parent?.dispatch) {
                parent.dispatch(DrawerActions.toggleDrawer());
              } else if ((navigation as any).dispatch) {
                (navigation as any).dispatch(DrawerActions.toggleDrawer());
              } else {
                // Fallback: try to access drawer through root navigation
                const root = (navigation as any).getRootState?.();
                if (root?.routes?.[0]?.state) {
                  (navigation as any).dispatch(DrawerActions.toggleDrawer());
                }
              }
            } catch (error) {
              console.error('Error toggling drawer:', error);
            }
          }}
          style={{ paddingHorizontal: 8 }}
        >
          <Icon name="menu" size={24} color={colors.text.inverse} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, colors.text.inverse]);

  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      {/* Header handled by native navigation */}

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