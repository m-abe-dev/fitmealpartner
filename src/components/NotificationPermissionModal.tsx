import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Bell } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../design-system';
import NotificationService from '../services/NotificationService';

interface NotificationPermissionModalProps {
  visible: boolean;
  onClose: () => void;
  onPermissionGranted: () => void;
}

export const NotificationPermissionModal: React.FC<NotificationPermissionModalProps> = ({
  visible,
  onClose,
  onPermissionGranted,
}) => {
  const handleAllow = async () => {
    const granted = await NotificationService.requestPermissions();
    
    if (granted) {
      onPermissionGranted();
      // デフォルトの通知をスケジュール
      await NotificationService.scheduleProteinReminder(30); // 仮の値
    }
    
    onClose();
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Bell size={48} color={colors.primary.main} />
          </View>

          <Text style={styles.title}>
            通知を有効にして{'\n'}目標達成をサポート
          </Text>

          <Text style={styles.description}>
            タンパク質摂取リマインダーや{'\n'}
            ワークアウトの時間をお知らせします
          </Text>

          <View style={styles.features}>
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>🥩</Text>
              <Text style={styles.featureText}>
                毎日20時にタンパク質{'\n'}不足をお知らせ
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>💪</Text>
              <Text style={styles.featureText}>
                トレーニング時間の{'\n'}リマインダー
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Text style={styles.featureIcon}>📊</Text>
              <Text style={styles.featureText}>
                目標達成の{'\n'}お祝い通知
              </Text>
            </View>
          </View>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={styles.allowButton}
              onPress={handleAllow}
            >
              <Text style={styles.allowButtonText}>通知を許可</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>あとで</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginHorizontal: spacing.lg,
    maxWidth: 340,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.primary.main + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: typography.fontSize.base * 1.5,
  },
  features: {
    width: '100%',
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    flex: 1,
  },
  buttons: {
    width: '100%',
    gap: spacing.sm,
  },
  allowButton: {
    backgroundColor: colors.primary.main,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  allowButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
  },
  skipButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  skipButtonText: {
    color: colors.text.secondary,
    fontSize: typography.fontSize.base,
  },
});