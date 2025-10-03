import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { colors, darkColors } from './colors';

export type ThemeType = 'light' | 'dark';

interface ThemeColors {
  primary: string;
  primaryDark: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  error: string;
  success: string;
  warning: string;
  info: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  border: string;
  divider: string;
  shadow: string;
}

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ThemeType>('light');

  useEffect(() => {
    // Load saved theme preference from AsyncStorage in a real app
    // For now, we'll use localStorage equivalent for React Native
    // const savedTheme = AsyncStorage.getItem('theme');
    // if (savedTheme) setTheme(savedTheme as ThemeType);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);

    // Save theme preference in a real app
    // AsyncStorage.setItem('theme', newTheme);
  };

  const themeColors = theme === 'light' ? colors : darkColors;

  const value: ThemeContextType = {
    theme,
    colors: themeColors,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
