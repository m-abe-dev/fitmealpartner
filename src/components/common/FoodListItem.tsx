import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Animated,
} from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { Badge } from './Badge';
import { Button } from './Button';
import { CompactMacroDisplay } from './MacroDisplay';

interface Food {
  id: string;
  name: string;
  protein: number;
  fat: number;
  carbs: number;
  calories: number;
  amount?: number;
  unit?: string;
  timestamp?: Date;
  icon?: string;
}

interface FoodListItemProps {
  food: Food;
  onPress?: (food: Food) => void;
  onEdit?: (food: Food) => void;
  onDelete?: (id: string) => void;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
  showMacros?: boolean;
  showTimestamp?: boolean;
  style?: ViewStyle;
  variant?: 'default' | 'compact' | 'detailed';
  swipeActions?: Array<{
    label: string;
    color: string;
    onPress: () => void;
    icon?: React.ReactNode;
  }>;
}

export const FoodListItem: React.FC<FoodListItemProps> = ({
  food,
  onPress,
  onEdit,
  onDelete,
  onFavorite,
  isFavorite = false,
  showMacros = true,
  showTimestamp = false,
  style,
  variant = 'default',
  swipeActions,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwipedOpen, setIsSwipedOpen] = useState(false);

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'たった今';
    if (minutes < 60) return `${minutes}分前`;
    if (hours < 24) return `${hours}時間前`;
    return timestamp.toLocaleDateString('ja-JP');
  };

  const handleSwipeStart = (event: any) => {
    // Handle swipe gesture start
  };

  const handleSwipeMove = (translationX: number) => {
    translateX.setValue(translationX);
  };

  const handleSwipeEnd = (translationX: number) => {
    const shouldOpen = translationX < -50;
    const targetValue = shouldOpen ? -120 : 0;
    
    Animated.spring(translateX, {
      toValue: targetValue,
      useNativeDriver: true,
    }).start();
    
    setIsSwipedOpen(shouldOpen);
  };

  const closeSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
    }).start();
    setIsSwipedOpen(false);
  };

  const macroData = {
    protein: { current: food.protein, target: 100 },
    fat: { current: food.fat, target: 100 },
    carbs: { current: food.carbs, target: 100 },
    calories: { current: food.calories, target: 100 },
  };

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        style={[styles.compactContainer, style]}
        onPress={() => onPress?.(food)}
        activeOpacity={0.7}
      >
        <View style={styles.compactContent}>
          <View style={styles.compactHeader}>
            <Text style={styles.compactIcon}>{food.icon || '🍽️'}</Text>
            <Text style={styles.compactName} numberOfLines={1}>
              {food.name}
            </Text>
            {isFavorite && <Text style={styles.favoriteIcon}>⭐</Text>}
          </View>
          <Text style={styles.compactCalories}>
            {food.calories} kcal
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'detailed') {
    return (
      <View style={[styles.detailedContainer, style]}>
        <TouchableOpacity
          style={styles.detailedContent}
          onPress={() => setIsExpanded(!isExpanded)}
          activeOpacity={0.7}
        >
          <View style={styles.detailedHeader}>
            <View style={styles.detailedLeft}>
              <Text style={styles.detailedIcon}>{food.icon || '🍽️'}</Text>
              <View style={styles.detailedInfo}>
                <Text style={styles.detailedName}>{food.name}</Text>
                {food.amount && (
                  <Text style={styles.detailedAmount}>
                    {food.amount}{food.unit || 'g'}
                  </Text>
                )}
                {showTimestamp && food.timestamp && (
                  <Text style={styles.timestamp}>
                    {formatTimestamp(food.timestamp)}
                  </Text>
                )}
              </View>
            </View>
            
            <View style={styles.detailedRight}>
              <Text style={styles.detailedCalories}>
                {food.calories} kcal
              </Text>
              {isFavorite && (
                <Badge variant="warning" size="small">
                  ⭐
                </Badge>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.expandedContent}>
            {showMacros && (
              <CompactMacroDisplay data={macroData} />
            )}
            
            <View style={styles.detailedActions}>
              {onEdit && (
                <Button
                  title="編集"
                  onPress={() => onEdit(food)}
                  variant="outline"
                  size="small"
                />
              )}
              {onFavorite && (
                <Button
                  title={isFavorite ? '⭐解除' : '⭐追加'}
                  onPress={() => onFavorite(food.id)}
                  variant="ghost"
                  size="small"
                />
              )}
              {onDelete && (
                <Button
                  title="削除"
                  onPress={() => onDelete(food.id)}
                  variant="outline"
                  size="small"
                  style={styles.deleteButton}
                />
              )}
            </View>
          </View>
        )}
      </View>
    );
  }

  // Default variant with swipe actions
  return (
    <View style={[styles.swipeContainer, style]}>
      {/* Swipe Actions Background */}
      {swipeActions && (
        <View style={styles.swipeActionsContainer}>
          {swipeActions.map((action, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.swipeAction, { backgroundColor: action.color }]}
              onPress={() => {
                action.onPress();
                closeSwipe();
              }}
            >
              {action.icon || <Text style={styles.swipeActionText}>{action.label}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Main Content */}
      <Animated.View
        style={[
          styles.defaultContainer,
          { transform: [{ translateX }] }
        ]}
      >
        <TouchableOpacity
          style={styles.defaultContent}
          onPress={() => {
            if (isSwipedOpen) {
              closeSwipe();
            } else {
              onPress?.(food);
            }
          }}
          activeOpacity={0.7}
        >
            <View style={styles.defaultHeader}>
              <View style={styles.defaultLeft}>
                <Text style={styles.defaultIcon}>{food.icon || '🍽️'}</Text>
                <View style={styles.defaultInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.defaultName} numberOfLines={1}>
                      {food.name}
                    </Text>
                    {isFavorite && <Text style={styles.favoriteIcon}>⭐</Text>}
                  </View>
                  
                  {food.amount && (
                    <Text style={styles.defaultAmount}>
                      {food.amount}{food.unit || 'g'}
                    </Text>
                  )}
                  
                  {showTimestamp && food.timestamp && (
                    <Text style={styles.timestamp}>
                      {formatTimestamp(food.timestamp)}
                    </Text>
                  )}
                </View>
              </View>
              
              <View style={styles.defaultRight}>
                <Text style={styles.defaultCalories}>
                  {food.calories} kcal
                </Text>
                
                {showMacros && (
                  <View style={styles.macroSummary}>
                    <Text style={styles.macroText}>
                      P: {food.protein}g F: {food.fat}g C: {food.carbs}g
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </Animated.View>
    </View>
  );
};

// Food List Component
interface FoodListProps {
  foods: Food[];
  onItemPress?: (food: Food) => void;
  onItemEdit?: (food: Food) => void;
  onItemDelete?: (id: string) => void;
  onItemFavorite?: (id: string) => void;
  favorites?: Set<string>;
  style?: ViewStyle;
  variant?: 'default' | 'compact' | 'detailed';
  showMacros?: boolean;
  showTimestamp?: boolean;
  emptyMessage?: string;
}

export const FoodList: React.FC<FoodListProps> = ({
  foods,
  onItemPress,
  onItemEdit,
  onItemDelete,
  onItemFavorite,
  favorites = new Set(),
  style,
  variant = 'default',
  showMacros = true,
  showTimestamp = false,
  emptyMessage = '食品がありません',
}) => {
  if (foods.length === 0) {
    return (
      <View style={[styles.emptyContainer, style]}>
        <Text style={styles.emptyMessage}>{emptyMessage}</Text>
      </View>
    );
  }

  const swipeActions = [
    {
      label: '編集',
      color: colors.primary.main,
      onPress: () => {},
      icon: <Text style={styles.swipeActionIcon}>✏️</Text>,
    },
    {
      label: '削除',
      color: colors.status.error,
      onPress: () => {},
      icon: <Text style={styles.swipeActionIcon}>🗑️</Text>,
    },
  ];

  return (
    <View style={[styles.listContainer, style]}>
      {foods.map((food) => (
        <FoodListItem
          key={food.id}
          food={food}
          onPress={onItemPress}
          onEdit={onItemEdit}
          onDelete={onItemDelete}
          onFavorite={onItemFavorite}
          isFavorite={favorites.has(food.id)}
          showMacros={showMacros}
          showTimestamp={showTimestamp}
          variant={variant}
          swipeActions={variant === 'default' ? [
            {
              ...swipeActions[0],
              onPress: () => onItemEdit?.(food),
            },
            {
              ...swipeActions[1],
              onPress: () => onItemDelete?.(food.id),
            },
          ] : undefined}
          style={styles.listItem}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  // Swipe Container
  swipeContainer: {
    position: 'relative',
    marginVertical: spacing.xs,
  },
  swipeActionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  swipeAction: {
    width: 60,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeActionText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
  },
  swipeActionIcon: {
    fontSize: typography.fontSize.lg,
  },

  // Default Variant
  defaultContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.md,
    ...shadows.sm,
  },
  defaultContent: {
    padding: spacing.sm,
  },
  defaultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  defaultLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  defaultIcon: {
    fontSize: typography.fontSize['2xl'],
    marginRight: spacing.sm,
  },
  defaultInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  defaultName: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    flex: 1,
  },
  favoriteIcon: {
    fontSize: typography.fontSize.sm,
  },
  defaultAmount: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xxs,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xxs,
  },
  defaultRight: {
    alignItems: 'flex-end',
  },
  defaultCalories: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
  },
  macroSummary: {
    marginTop: spacing.xxs,
  },
  macroText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },

  // Compact Variant
  compactContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.sm,
    padding: spacing.xs,
    marginVertical: spacing.xxxs,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  compactIcon: {
    fontSize: typography.fontSize.base,
    marginRight: spacing.xs,
  },
  compactName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    flex: 1,
  },
  compactCalories: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
  },

  // Detailed Variant
  detailedContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    marginVertical: spacing.xs,
    ...shadows.md,
    overflow: 'hidden',
  },
  detailedContent: {
    padding: spacing.md,
  },
  detailedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  detailedIcon: {
    fontSize: typography.fontSize['3xl'],
    marginRight: spacing.md,
  },
  detailedInfo: {
    flex: 1,
  },
  detailedName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text.primary,
  },
  detailedAmount: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xxs,
  },
  detailedRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  detailedCalories: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  expandedContent: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    padding: spacing.md,
    gap: spacing.md,
  },
  detailedActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
  },
  deleteButton: {
    borderColor: colors.status.error,
  },

  // List Styles
  listContainer: {
    gap: spacing.xs,
  },
  listItem: {
    marginVertical: 0,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessage: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
});