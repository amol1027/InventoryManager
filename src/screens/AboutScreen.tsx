import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const AboutScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const styles = getStyles(colors);

  const appInfo = {
    name: 'Vinayak Agencies',
    version: '1.2.1',
    build: '2025.10.3',
    developer: 'Amol Solase', 
  };

  useLayoutEffect(() => {
    (navigation as any).setOptions({
      title: 'About',
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

  return (
    <ScrollView style={styles.content}>
      {/* App Information */}
      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Application Information</Text>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>App Name</Text>
          <Text style={styles.infoValue}>{appInfo.name}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Version</Text>
          <Text style={styles.infoValue}>{appInfo.version}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Build Number</Text>
          <Text style={styles.infoValue}>{appInfo.build}</Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Developer</Text>
          <Text style={styles.infoValue}>{appInfo.developer}</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 {appInfo.name}</Text>
       
        <Text style={styles.footerText}>Made with ❤️ by {appInfo.developer}</Text>
      </View>
    </ScrollView>
  );
};

const getStyles = (colors: any) => StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  infoSection: {
    padding: 20,
    backgroundColor: colors.surface,
    margin: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  footerText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
    textAlign: 'center',
  },
});

export default AboutScreen;