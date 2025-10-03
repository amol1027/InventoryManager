import { Alert } from 'react-native';

/**
 * Confirmation dialog types
 */
export enum ConfirmationType {
  DELETE = 'DELETE',
  DISCARD = 'DISCARD',
  LOGOUT = 'LOGOUT',
  RESET = 'RESET',
  OVERWRITE = 'OVERWRITE',
  CUSTOM = 'CUSTOM',
}

/**
 * Confirmation dialog configuration
 */
export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationType;
  destructive?: boolean;
}

/**
 * Default configurations for common confirmation types
 */
const DEFAULT_CONFIGS: Record<ConfirmationType, ConfirmationConfig> = {
  [ConfirmationType.DELETE]: {
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
    type: ConfirmationType.DELETE,
    destructive: true,
  },
  [ConfirmationType.DISCARD]: {
    title: 'Discard Changes',
    message: 'You have unsaved changes. Are you sure you want to discard them?',
    confirmText: 'Discard',
    cancelText: 'Keep Editing',
    type: ConfirmationType.DISCARD,
    destructive: true,
  },
  [ConfirmationType.LOGOUT]: {
    title: 'Sign Out',
    message: 'Are you sure you want to sign out?',
    confirmText: 'Sign Out',
    cancelText: 'Cancel',
    type: ConfirmationType.LOGOUT,
    destructive: false,
  },
  [ConfirmationType.RESET]: {
    title: 'Reset Settings',
    message: 'This will reset all settings to their default values. Are you sure?',
    confirmText: 'Reset',
    cancelText: 'Cancel',
    type: ConfirmationType.RESET,
    destructive: true,
  },
  [ConfirmationType.OVERWRITE]: {
    title: 'Overwrite Data',
    message: 'This will overwrite existing data. Are you sure you want to continue?',
    confirmText: 'Overwrite',
    cancelText: 'Cancel',
    type: ConfirmationType.OVERWRITE,
    destructive: true,
  },
  [ConfirmationType.CUSTOM]: {
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: ConfirmationType.CUSTOM,
    destructive: false,
  },
};

/**
 * Confirmation dialog utility class
 */
export class ConfirmationDialog {
  /**
   * Show a confirmation dialog
   */
  static show(
    config: ConfirmationConfig | ConfirmationType,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    const dialogConfig = typeof config === 'string'
      ? DEFAULT_CONFIGS[config]
      : { ...DEFAULT_CONFIGS.CUSTOM, ...config };

    Alert.alert(
      dialogConfig.title,
      dialogConfig.message,
      [
        {
          text: dialogConfig.cancelText || 'Cancel',
          style: 'cancel',
          onPress: onCancel,
        },
        {
          text: dialogConfig.confirmText || 'Confirm',
          style: dialogConfig.destructive ? 'destructive' : 'default',
          onPress: onConfirm,
        },
      ]
    );
  }

  /**
   * Show delete confirmation
   */
  static showDelete(
    itemName: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    const config = {
      ...DEFAULT_CONFIGS.DELETE,
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    };
    this.show(config, onConfirm, onCancel);
  }

  /**
   * Show discard changes confirmation
   */
  static showDiscardChanges(
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    this.show(DEFAULT_CONFIGS.DISCARD, onConfirm, onCancel);
  }

  /**
   * Show logout confirmation
   */
  static showLogout(
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    this.show(DEFAULT_CONFIGS.LOGOUT, onConfirm, onCancel);
  }

  /**
   * Show reset confirmation
   */
  static showReset(
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    this.show(DEFAULT_CONFIGS.RESET, onConfirm, onCancel);
  }

  /**
   * Show custom confirmation with specific message
   */
  static showCustom(
    title: string,
    message: string,
    confirmText: string = 'Confirm',
    cancelText: string = 'Cancel',
    onConfirm: () => void,
    onCancel?: () => void,
    destructive: boolean = false
  ): void {
    const config: ConfirmationConfig = {
      title,
      message,
      confirmText,
      cancelText,
      type: ConfirmationType.CUSTOM,
      destructive,
    };
    this.show(config, onConfirm, onCancel);
  }
}

/**
 * Navigation confirmation utilities
 */
export class NavigationConfirmation {
  /**
   * Confirm navigation when there are unsaved changes
   */
  static confirmUnsavedChanges(
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    ConfirmationDialog.showDiscardChanges(onConfirm, onCancel);
  }

  /**
   * Confirm navigation to a different section
   */
  static confirmSectionChange(
    targetSection: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    ConfirmationDialog.showCustom(
      'Change Section',
      `Navigate to ${targetSection}?`,
      'Go',
      'Stay',
      onConfirm,
      onCancel,
      false
    );
  }
}
