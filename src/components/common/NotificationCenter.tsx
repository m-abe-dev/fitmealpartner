import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import {
  PanGestureHandler,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bell,
  X,
  Check,
  Dumbbell,
  Utensils,
  TrendingUp,
  Calendar,
  Sparkles,
  CheckCheck,
  Settings,
  Star,
} from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Notification {
  id: string;
  type: 'workout' | 'nutrition' | 'achievement' | 'reminder' | 'feature' | 'system';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  priority: 'high' | 'medium' | 'low';
  actionRequired?: boolean;
}

interface NotificationCenterProps {
  visible?: boolean;
  onClose?: () => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  visible: externalVisible,
  onClose: externalOnClose,
}) => {
  const [internalVisible, setInternalVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'workout',
      title: '今日の筋トレ予定',
      message: '上半身トレーニングの時間です！プッシュアップ・プルアップ・プランクを組み合わせて効果的に進めましょう。',
      time: '2時間前',
      isRead: false,
      priority: 'high',
      actionRequired: true,
    },
    {
      id: '2',
      type: 'achievement',
      title: '目標達成おめでとう！',
      message: 'タンパク質摂取目標を7日連続で達成しました！この調子で筋肉合成を最適化していきましょう。',
      time: '4時間前',
      isRead: false,
      priority: 'medium',
    },
    {
      id: '3',
      type: 'nutrition',
      title: 'プロテイン摂取のタイミング',
      message: 'トレーニング後30分以内のプロテイン摂取が効果的です。今すぐプロテインドリンクを飲みましょう！',
      time: '6時間前',
      isRead: true,
      priority: 'medium',
      actionRequired: true,
    },
    {
      id: '4',
      type: 'feature',
      title: '新機能: AIミール提案',
      message: 'あなたの目標に最適化されたミールプランを自動生成する機能が追加されました。栄養タブからお試しください！',
      time: '1日前',
      isRead: false,
      priority: 'low',
    },
    {
      id: '5',
      type: 'reminder',
      title: '水分補給リマインダー',
      message: '最後の水分補給から2時間が経過しました。コップ1杯の水を飲んで代謝をサポートしましょう。',
      time: '2日前',
      isRead: true,
      priority: 'low',
    },
    {
      id: '6',
      type: 'system',
      title: 'データバックアップ完了',
      message: 'あなたの健康データが安全にバックアップされました。SQLiteによる端末内処理で安心です。',
      time: '3日前',
      isRead: true,
      priority: 'low',
    },
  ]);

  const modalY = useRef(new Animated.Value(screenHeight)).current;
  const swipeRefs = useRef<{ [key: string]: Animated.Value }>({});

  // Initialize swipe animations for each notification
  notifications.forEach((notification) => {
    if (!swipeRefs.current[notification.id]) {
      swipeRefs.current[notification.id] = new Animated.Value(0);
    }
  });

  const isVisible = externalVisible !== undefined ? externalVisible : internalVisible;
  const handleClose = externalOnClose || (() => setInternalVisible(false));

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const showModal = () => {
    if (externalVisible === undefined) {
      setInternalVisible(true);
    }
    Animated.spring(modalY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  const hideModal = () => {
    Animated.spring(modalY, {
      toValue: screenHeight,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      handleClose();
    });
  };

  const getNotificationIcon = (type: string, size: number = 20) => {
    const iconProps = { size, color: colors.text.primary };
    
    switch (type) {
      case 'workout':
        return <Dumbbell {...iconProps} />;
      case 'nutrition':
        return <Utensils {...iconProps} />;
      case 'achievement':
        return <Star {...iconProps} />;
      case 'reminder':
        return <Calendar {...iconProps} />;
      case 'feature':
        return <Sparkles {...iconProps} />;
      case 'system':
        return <Settings {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const getNotificationColors = (type: string, priority: string) => {
    if (priority === 'high') {
      return {
        background: colors.status.error + '10',
        border: colors.status.error + '30',
        icon: colors.status.error,
      };
    }

    switch (type) {
      case 'workout':
        return {
          background: colors.primary[50],
          border: colors.primary[200],
          icon: colors.primary.main,
        };
      case 'nutrition':
        return {
          background: colors.status.success + '10',
          border: colors.status.success + '30',
          icon: colors.status.success,
        };
      case 'achievement':
        return {
          background: colors.status.warning + '10',
          border: colors.status.warning + '30',
          icon: colors.status.warning,
        };
      case 'reminder':
        return {
          background: colors.accent.purple + '10',
          border: colors.accent.purple + '30',
          icon: colors.accent.purple,
        };
      case 'feature':
        return {
          background: colors.primary[100],
          border: colors.primary[200],
          icon: colors.primary[600],
        };
      case 'system':
        return {
          background: colors.gray[50],
          border: colors.gray[200],
          icon: colors.gray[500],
        };
      default:
        return {
          background: colors.gray[50],
          border: colors.gray[200],
          icon: colors.gray[500],
        };
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="error" size="small">緊急</Badge>;
      case 'medium':
        return <Badge variant="warning" size="small">重要</Badge>;
      default:
        return null;
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, isRead: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true }))
    );
  };

  const deleteNotification = (id: string) => {
    const swipeAnim = swipeRefs.current[id];
    
    Animated.spring(swipeAnim, {
      toValue: screenWidth,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start(() => {
      setNotifications((prev) => prev.filter((notification) => notification.id !== id));
      delete swipeRefs.current[id];
    });
  };

  const handleSwipeGesture = (id: string, gestureState: { nativeEvent: { translationX: number; velocityX: number } }) => {
    const { translationX, velocityX } = gestureState.nativeEvent;
    const swipeAnim = swipeRefs.current[id];

    if (Math.abs(translationX) > screenWidth * 0.3 || Math.abs(velocityX) > 1000) {
      // Delete if swiped far enough or fast enough
      deleteNotification(id);
    } else {
      // Bounce back
      Animated.spring(swipeAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();
    }
  };

  const renderNotificationItem = (notification: Notification, index: number) => {
    const colors_theme = getNotificationColors(notification.type, notification.priority);
    const swipeAnim = swipeRefs.current[notification.id];

    return (
      <PanGestureHandler
        key={notification.id}
        onGestureEvent={Animated.event(
          [{ nativeEvent: { translationX: swipeAnim } }],
          { useNativeDriver: true }
        )}
        onHandlerStateChange={(event) => handleSwipeGesture(notification.id, event)}
      >
        <Animated.View
          style={[
            {
              transform: [{ translateX: swipeAnim }],
            },
          ]}
        >
          <Card
            style={{
              ...styles.notificationItem,
              backgroundColor: colors_theme.background,
              borderColor: colors_theme.border,
              opacity: notification.isRead ? 0.7 : 1,
            }}
          >
            <View style={styles.notificationContent}>
              <View style={[styles.iconContainer, { backgroundColor: colors_theme.background }]}>
                {getNotificationIcon(notification.type, 20)}
              </View>

              <View style={styles.contentContainer}>
                <View style={styles.headerRow}>
                  <Text style={styles.notificationTitle} numberOfLines={2}>
                    {notification.title}
                  </Text>
                  <View style={styles.badgeContainer}>
                    {getPriorityBadge(notification.priority)}
                    {notification.actionRequired && (
                      <Badge variant="warning" size="small">
                        要アクション
                      </Badge>
                    )}
                  </View>
                </View>

                <Text style={styles.notificationMessage} numberOfLines={3}>
                  {notification.message}
                </Text>

                <View style={styles.footerRow}>
                  <Text style={styles.timeText}>{notification.time}</Text>
                  <View style={styles.actionButtons}>
                    {!notification.isRead && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => markAsRead(notification.id)}
                      >
                        <Check size={14} color={colors.primary.main} />
                        <Text style={styles.actionButtonText}>既読</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => deleteNotification(notification.id)}
                    >
                      <X size={14} color={colors.status.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </Card>
        </Animated.View>
      </PanGestureHandler>
    );
  };

  const NotificationButton = () => (
    <TouchableOpacity
      style={styles.triggerButton}
      onPress={externalVisible === undefined ? showModal : undefined}
      activeOpacity={0.7}
    >
      <Bell size={24} color={colors.text.primary} />
      {unreadCount > 0 && (
        <Animated.View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount.toString()}
          </Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );

  const ModalContent = () => (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={hideModal}
    >
      <GestureHandlerRootView style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={hideModal}
        />
        
        <Animated.View
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: modalY }],
            },
          ]}
        >
          <SafeAreaView style={styles.modalInner}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.dragIndicator} />
              <View style={styles.headerContent}>
                <View style={styles.titleRow}>
                  <Bell size={24} color={colors.text.primary} />
                  <Text style={styles.modalTitle}>通知センター</Text>
                  {unreadCount > 0 && (
                    <Badge variant="error" size="small">
                      {unreadCount}件未読
                    </Badge>
                  )}
                </View>
                
                {notifications.length > 0 && unreadCount > 0 && (
                  <Button
                    title="すべて既読"
                    variant="outline"
                    size="small"
                    onPress={markAllAsRead}
                    style={styles.markAllButton}
                  />
                )}
              </View>
              
              <TouchableOpacity style={styles.closeButton} onPress={hideModal}>
                <X size={24} color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.scrollArea}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Bell size={48} color={colors.text.tertiary} />
                  <Text style={styles.emptyTitle}>通知はありません</Text>
                  <Text style={styles.emptySubtitle}>
                    新しい通知があるとここに表示されます
                  </Text>
                </View>
              ) : (
                <View style={styles.notificationList}>
                  {notifications.map(renderNotificationItem)}
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );

  React.useEffect(() => {
    if (isVisible) {
      showModal();
    }
  }, [isVisible]);

  // If used as controlled component, only return modal
  if (externalVisible !== undefined) {
    return <ModalContent />;
  }

  // If used as standalone component, return button + modal
  return (
    <>
      <NotificationButton />
      <ModalContent />
    </>
  );
};

const styles = StyleSheet.create({
  // Trigger Button
  triggerButton: {
    position: 'relative',
    padding: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.background.primary + '80',
    borderWidth: 1,
    borderColor: colors.border.light,
    ...shadows.sm,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.status.error,
    borderRadius: radius.full,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  badgeText: {
    fontSize: typography.fontSize.xs - 2,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modalContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: screenHeight * 0.8,
    ...shadows.xl,
  },
  modalInner: {
    flex: 1,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.gray[300],
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },

  // Header
  modalHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerContent: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    flex: 1,
  },
  markAllButton: {
    alignSelf: 'flex-start',
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.lg,
    padding: spacing.xs,
  },

  // Content
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  notificationList: {
    gap: spacing.md,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

  // Notification Item
  notificationItem: {
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  notificationContent: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  contentContainer: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  notificationTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    flex: 1,
    marginRight: spacing.sm,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  notificationMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.fontSize.sm * 1.4,
    marginBottom: spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: radius.sm,
    backgroundColor: colors.background.secondary,
  },
  deleteButton: {
    backgroundColor: colors.status.error + '10',
  },
  actionButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.medium,
  },
});