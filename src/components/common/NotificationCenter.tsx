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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotificationCenter, Notification } from '../../hooks/useNotificationCenter';
import {
  Bell,
  X,
  Check,
  Dumbbell,
  Utensils,
} from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { Card } from './Card';
import { Badge } from './Badge';
import { Button } from './Button';

const { height: screenHeight } = Dimensions.get('window');


interface NotificationCenterProps {
  visible?: boolean;
  onClose?: () => void;
  renderTrigger?: (unreadCount: number) => React.ReactNode;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  visible: externalVisible,
  onClose: externalOnClose,
  renderTrigger,
}) => {
  const [internalVisible, setInternalVisible] = useState(false);

  // グローバル状態管理フックを使用
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotificationCenter();

  const modalY = useRef(new Animated.Value(screenHeight)).current;

  const isVisible = externalVisible !== undefined ? externalVisible : internalVisible;
  const handleClose = externalOnClose || (() => setInternalVisible(false));

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

      handleClose();
  };

  const getNotificationIcon = (category: string, size: number = 20) => {
    const iconProps = { size, color: colors.text.primary };

    switch (category) {
      case 'workout':
        return <Dumbbell {...iconProps} />;
      case 'nutrition':
        return <Utensils {...iconProps} />;
      case 'announcement':
        return <Bell {...iconProps} />;
      default:
        return <Bell {...iconProps} />;
    }
  };

  const getNotificationColors = (category: string) => {
    switch (category) {
      case 'workout':
        return {
          background: colors.primary.main + '10',
          border: colors.primary.main + '30',
          icon: colors.primary.main,
        };
      case 'nutrition':
        return {
          background: colors.status.success + '10',
          border: colors.status.success + '30',
          icon: colors.status.success,
        };
      case 'announcement':
        return {
          background: colors.status.warning + '10',
          border: colors.status.warning + '30',
          icon: colors.status.warning,
        };
      default:
        return {
          background: colors.gray[50],
          border: colors.gray[200],
          icon: colors.gray[500],
        };
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'workout':
        return <Badge variant="default" size="small">筋トレ</Badge>;
      case 'nutrition':
        return <Badge variant="success" size="small">食べ物</Badge>;
      case 'announcement':
        return <Badge variant="warning" size="small">お知らせ</Badge>;
      default:
        return null;
    }
  };


  const renderNotificationItem = (notification: Notification, index: number) => {
    const colors_theme = getNotificationColors(notification.category);

    return (
      <Card
        key={notification.id}
        style={{
          ...styles.notificationItem,
          backgroundColor: colors_theme.background,
          borderColor: colors_theme.border,
          opacity: notification.isRead ? 0.7 : 1,
        }}
      >
        <View style={styles.notificationContent}>
          <View style={[styles.iconContainer, { backgroundColor: colors_theme.background }]}>
            {getNotificationIcon(notification.category, 20)}
          </View>

          <View style={styles.contentContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.notificationTitle} numberOfLines={2}>
                {notification.title}
              </Text>
              <View style={styles.badgeContainer}>
                {getCategoryBadge(notification.category)}
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
                    <Text style={styles.actionButtonText}>既読する</Text>
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
      <View style={styles.modalOverlay}>
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

              {/* Title and Close Button Row */}
              <View style={styles.titleCloseRow}>
                <View style={styles.titleSection}>
                  <Bell size={24} color={colors.text.primary} />
                  <Text style={styles.modalTitle}>通知センター</Text>
                </View>
                <TouchableOpacity style={styles.closeButton} onPress={hideModal}>
                  <X size={24} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              {/* Badge and Actions Row */}
              <View style={styles.badgeActionsRow}>
                {unreadCount > 0 && (
                  <Badge variant="error" size="small">
                    {unreadCount}件未読
                  </Badge>
                )}
                <View style={styles.spacer} />
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
      </View>
    </Modal>
  );

  React.useEffect(() => {
    if (isVisible) {
      showModal();
    }
  }, [isVisible]);

  // If renderTrigger is provided, use it (for ScreenHeader integration)
  if (renderTrigger) {
    return (
      <>
        {renderTrigger(unreadCount)}
        {isVisible && <ModalContent />}
      </>
    );
  }

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
    height: screenHeight * 0.8,
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
  titleCloseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  titleSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  badgeActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
  },
  spacer: {
    flex: 1,
  },
  markAllButton: {
    marginLeft: spacing.sm,
  },

  // Content
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
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