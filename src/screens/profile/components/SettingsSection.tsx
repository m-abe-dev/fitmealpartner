import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { 
  Crown, 
  Smartphone, 
  Moon, 
  ChevronRight, 
  Activity, 
  Award, 
  Bell 
} from 'lucide-react-native';
import { colors, typography, spacing } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';

interface DeviceConnection {
  name: string;
  type: 'fitness' | 'health' | 'smart_scale';
  connected: boolean;
  icon: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

interface SettingsSectionProps {
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => void;
  deviceConnections: DeviceConnection[];
  achievements: Achievement[];
  darkModeEnabled: boolean;
  setDarkModeEnabled: (enabled: boolean) => void;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  notificationsEnabled,
  setNotificationsEnabled,
  deviceConnections,
  achievements,
  darkModeEnabled,
  setDarkModeEnabled,
}) => {
  return (
    <>
      {/* デバイス連携 */}
      <Card style={styles.devicesCard}>
        <View style={styles.devicesHeader}>
          <Smartphone size={20} color={colors.text.primary} />
          <Text style={styles.devicesTitle}>デバイス連携</Text>
        </View>
        <View style={styles.devicesList}>
          {deviceConnections.map((device, index) => (
            <View key={index} style={styles.deviceItem}>
              <View style={styles.deviceInfo}>
                <Text style={styles.deviceIcon}>{device.icon}</Text>
                <Text style={styles.deviceName}>{device.name}</Text>
              </View>
              <Switch
                value={device.connected}
                onValueChange={() => {
                  Alert.alert(
                    'デバイス連携',
                    `${device.name}の連携を${device.connected ? '解除' : '開始'}しますか？`
                  );
                }}
                trackColor={{
                  false: colors.gray[300],
                  true: colors.primary[100]
                }}
                thumbColor={device.connected ? colors.primary.main : colors.gray[400]}
              />
            </View>
          ))}
        </View>
      </Card>

      {/* 実績・バッジ */}
      <Card style={styles.achievementsCard}>
        <View style={styles.achievementsHeader}>
          <Award size={20} color={colors.status.warning} />
          <Text style={styles.achievementsTitle}>実績・バッジ</Text>
        </View>
        <View style={styles.achievementsList}>
          {achievements.map((achievement) => (
            <View
              key={achievement.id}
              style={[
                styles.achievementItem,
                !achievement.unlocked && styles.achievementLocked
              ]}
            >
              <Text style={[
                styles.achievementIcon,
                !achievement.unlocked && styles.achievementIconLocked
              ]}>
                {achievement.icon}
              </Text>
              <View style={styles.achievementInfo}>
                <Text style={[
                  styles.achievementTitle,
                  !achievement.unlocked && styles.achievementTextLocked
                ]}>
                  {achievement.title}
                </Text>
                <Text style={[
                  styles.achievementDescription,
                  !achievement.unlocked && styles.achievementTextLocked
                ]}>
                  {achievement.description}
                </Text>
              </View>
              {achievement.unlocked && (
                <Badge variant="success" size="small">
                  達成
                </Badge>
              )}
            </View>
          ))}
        </View>
      </Card>

      {/* 設定・その他 */}
      <Card style={styles.settingsCard}>
        <Text style={styles.settingsTitle}>設定</Text>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Bell size={20} color={colors.text.secondary} />
            <Text style={styles.settingItemText}>通知設定</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{
              false: colors.gray[300],
              true: colors.primary[100]
            }}
            thumbColor={notificationsEnabled ? colors.primary.main : colors.gray[400]}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Moon size={20} color={colors.text.secondary} />
            <Text style={styles.settingItemText}>ダークモード</Text>
          </View>
          <Switch
            value={darkModeEnabled}
            onValueChange={setDarkModeEnabled}
            trackColor={{
              false: colors.gray[300],
              true: colors.primary[100]
            }}
            thumbColor={darkModeEnabled ? colors.primary.main : colors.gray[400]}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Activity size={20} color={colors.text.secondary} />
            <Text style={styles.settingItemText}>データエクスポート</Text>
          </View>
          <ChevronRight size={20} color={colors.text.tertiary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingItemLeft}>
            <Crown size={20} color={colors.primary.main} />
            <Text style={styles.settingItemText}>PROプランにアップグレード</Text>
          </View>
          <ChevronRight size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
      </Card>
    </>
  );
};

const styles = StyleSheet.create({
  devicesCard: {
    marginBottom: spacing.md,
  },
  devicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  devicesTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  devicesList: {
    gap: spacing.sm,
  },
  deviceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
  },
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  deviceIcon: {
    fontSize: typography.fontSize.lg,
  },
  deviceName: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  achievementsCard: {
    marginBottom: spacing.md,
  },
  achievementsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  achievementsTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  achievementsList: {
    gap: spacing.sm,
  },
  achievementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderRadius: 8,
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    fontSize: typography.fontSize.xl,
  },
  achievementIconLocked: {
    opacity: 0.3,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  achievementDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xxxs,
  },
  achievementTextLocked: {
    opacity: 0.5,
  },
  settingsCard: {
    marginBottom: spacing.md,
  },
  settingsTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.md,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  settingItemText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },
});

export type { DeviceConnection, Achievement };