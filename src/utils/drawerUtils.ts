import { DrawerActions } from '@react-navigation/native';

// Utility function to safely toggle drawer
export const toggleDrawer = (navigation: any) => {
  try {
    // Try to get the parent navigator and toggle drawer
    const parent = navigation.getParent();
    if (parent && parent.dispatch) {
      parent.dispatch(DrawerActions.toggleDrawer());
      return;
    }

    // Fallback: try direct dispatch
    if (navigation.dispatch) {
      navigation.dispatch(DrawerActions.toggleDrawer());
      return;
    }

    // Last resort: try to find drawer in root
    if (navigation.getRootState) {
      const rootState = navigation.getRootState();
      if (rootState && rootState.routes && rootState.routes.length > 0) {
        const drawerNavigator = rootState.routes[0];
        if (drawerNavigator && drawerNavigator.state) {
          navigation.dispatch(DrawerActions.toggleDrawer());
        }
      }
    }
  } catch (error) {
    console.error('Error toggling drawer:', error);
  }
};
