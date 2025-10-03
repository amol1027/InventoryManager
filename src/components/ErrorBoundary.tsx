import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ErrorHandler } from '../utils/ErrorHandler';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error
    ErrorHandler.handle(error, 'ErrorBoundary', false);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error details for debugging
    if (__DEV__) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return <ErrorFallback error={this.state.error} onRetry={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

/**
 * Error fallback component
 */
const ErrorFallback = ({ error, onRetry }: { error?: Error; onRetry: () => void }) => {
  const { colors } = useTheme();

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
      backgroundColor: colors.background,
    },
    icon: {
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
      color: colors.text.primary,
      marginBottom: 8,
      textAlign: 'center',
    },
    message: {
      fontSize: 16,
      color: colors.text.secondary,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    retryButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    retryText: {
      color: colors.text.inverse,
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <View style={styles.container}>
      <Icon name="error-outline" size={64} color={colors.error} style={styles.icon} />
      <Text style={styles.title}>Oops! Something went wrong</Text>
      <Text style={styles.message}>
        We're sorry, but something unexpected happened. Please try again or restart the app.
      </Text>
      {__DEV__ && error && (
        <Text style={[styles.message, { fontSize: 12, color: colors.text.disabled }]}>
          Error: {error.message}
        </Text>
      )}
      <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Hook-based error boundary for functional components
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) => {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
};
