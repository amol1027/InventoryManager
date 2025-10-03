import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme/ThemeContext';

const AboutScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const appInfo = {
    name: 'Inventory Manager',
    version: '1.2.1',
    build: '2025.10.3',
    developer: 'Amol Solase', // Replace with actual developer name
    description: 'A comprehensive inventory management application built with React Native and SQLite for efficient business inventory tracking.',
  };

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
        <Text style={styles.footerText}>All Rights Reserved</Text>
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