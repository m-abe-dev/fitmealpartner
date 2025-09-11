import React from 'react';
import { RefreshControl } from 'react-native';
import { colors } from '../../design-system';

interface AppRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
}

export const AppRefreshControl: React.FC<AppRefreshControlProps> = ({
  refreshing,
  onRefresh,
}) => (
  <RefreshControl
    refreshing={refreshing}
    onRefresh={onRefresh}
    tintColor={colors.primary.main}
    colors={[colors.primary.main]}
    progressBackgroundColor={colors.background.primary}
  />
);