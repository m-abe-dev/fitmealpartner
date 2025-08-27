import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Edit3, User } from 'lucide-react-native';
import { colors, typography, spacing } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { getActivityLevelText } from '../../../utils/profileUtils';
import { UserProfile } from '../../../hooks/useProfileData';

interface ProfileHeaderProps {
  userProfile: UserProfile;
  onEditPress: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  userProfile,
  onEditPress,
}) => {
  return (
    <Card style={styles.profileCard}>
      <View style={styles.profileGradient}>
        <View style={styles.profileHeader}>
          <View style={styles.profileHeaderLeft}>
            <Text style={styles.profileSectionTitle}>基本情報</Text>
          </View>
          <TouchableOpacity
            style={styles.profileUpdateButton}
            onPress={onEditPress}
          >
            <Edit3 size={16} color={colors.text.inverse} />
            <Text style={styles.profileUpdateText}>更新</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <User size={40} color={colors.text.inverse} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {getActivityLevelText(userProfile.activityLevel)}
            </Text>
            <Text style={styles.userAge}>
              {userProfile.age}歳 • {userProfile.height}cm • {userProfile.weight}kg
            </Text>
            <Text style={styles.joinDate}>
              {new Date(userProfile.joinDate).toLocaleDateString('ja-JP')} から利用開始
            </Text>
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  profileCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  profileGradient: {
    backgroundColor: colors.primary.main,
    padding: spacing.lg,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  profileHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  profileSectionTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.medium,
    fontWeight: 'bold',
  },
  profileUpdateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.text.inverse + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.text.inverse + '30',
  },
  profileUpdateText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 999,
    backgroundColor: colors.text.inverse + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: typography.fontSize.xl,
    color: colors.text.inverse,
    fontFamily: typography.fontFamily.bold,
  },
  userAge: {
    fontSize: typography.fontSize.base,
    color: colors.text.inverse + '80',
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xxxs,
  },
  joinDate: {
    fontSize: typography.fontSize.sm,
    color: colors.text.inverse + '60',
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xxxs,
  },
});