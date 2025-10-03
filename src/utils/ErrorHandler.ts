import { Alert } from 'react-native';

/**
 * Error types for better error categorization
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  VALIDATION = 'VALIDATION',
  PERMISSION = 'PERMISSION',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

/**
 * Custom error class for app-specific errors
 */
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly userMessage: string;
  public readonly retryable: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    userMessage?: string,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.userMessage = userMessage || message;
    this.retryable = retryable;
  }
}

/**
 * Centralized error handler
 */
export class ErrorHandler {
  private static errorLog: Array<{ error: Error; timestamp: Date; context?: string }> = [];

  /**
   * Handle and log errors with appropriate user feedback
   */
  static handle(
    error: Error | AppError,
    context?: string,
    showAlert: boolean = true
  ): void {
    // Log error
    this.errorLog.push({
      error,
      timestamp: new Date(),
      context,
    });

    // Log to console in development
    if (__DEV__) {
      console.error(`Error in ${context || 'Unknown context'}:`, error);
    }

    // Show user-friendly alert
    if (showAlert) {
      const message = error instanceof AppError ? error.userMessage : error.message;

      Alert.alert(
        'Error',
        message,
        [
          {
            text: error instanceof AppError && error.retryable ? 'Retry' : 'OK',
            onPress: () => {
              if (error instanceof AppError && error.retryable) {
                // Trigger retry logic if needed
                console.log('Retry requested');
              }
            },
          },
        ]
      );
    }
  }

  /**
   * Get error logs for debugging
   */
  static getErrorLogs(): Array<{ error: Error; timestamp: Date; context?: string }> {
    return [...this.errorLog];
  }

  /**
   * Clear error logs
   */
  static clearErrorLogs(): void {
    this.errorLog = [];
  }

  /**
   * Wrap async function with error handling
   */
  static async withErrorHandling<T>(
    fn: () => Promise<T>,
    context?: string,
    showAlert: boolean = true
  ): Promise<T | null> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error as Error, context, showAlert);
      return null;
    }
  }
}

/**
 * Database error utilities
 */
export class DatabaseErrorHandler {
  static isConnectionError(error: Error): boolean {
    return error.message.includes('database') ||
           error.message.includes('connection') ||
           error.message.includes('SQLITE');
  }

  static isConstraintError(error: Error): boolean {
    return error.message.includes('UNIQUE constraint') ||
           error.message.includes('constraint failed');
  }

  static createDatabaseError(message: string, originalError?: Error): AppError {
    return new AppError(
      message,
      ErrorType.DATABASE,
      ErrorSeverity.HIGH,
      'Database operation failed. Please try again.',
      true
    );
  }
}

/**
 * Network error utilities
 */
export class NetworkErrorHandler {
  static isNetworkError(error: Error): boolean {
    return error.message.includes('network') ||
           error.message.includes('fetch') ||
           error.message.includes('timeout');
  }

  static createNetworkError(message: string, originalError?: Error): AppError {
    return new AppError(
      message,
      ErrorType.NETWORK,
      ErrorSeverity.HIGH,
      'Network connection failed. Please check your connection and try again.',
      true
    );
  }
}
