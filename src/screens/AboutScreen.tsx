import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import Header from '../components/Header';
import { colors } from '../theme/colors';

const AboutScreen = () => {
  return (
    <View style={styles.container}>
      <Header title="About" />
      <ScrollView style={styles.content}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>IM</Text>
          </View>
          <Text style={styles.appName}>Inventory Manager</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.sectionText}>
            Inventory Manager is a comprehensive solution for tracking and managing your product inventory.
            With features like product categorization, price management, and detailed reporting, it helps
            you keep your inventory organized and up-to-date.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Product management with categories</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Price and discount tracking</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Search and filter capabilities</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Offline data storage with SQLite</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>Modern, responsive UI design</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Developer Information</Text>
          <Text style={styles.sectionText}>
            Developed as a comprehensive inventory management solution using React Native and SQLite.
            This application demonstrates modern mobile development practices including responsive design,
            offline data storage, and intuitive user interfaces.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2023 Inventory Manager</Text>
          <Text style={styles.footerText}>All Rights Reserved</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    padding: 32,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.inverse,
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 8,
  },
  version: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 16,
    color: colors.text.primary,
    lineHeight: 24,
  },
  featureList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginBottom: 4,
  },
});

export default AboutScreen;