import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { colors, typography, spacing } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { Badge } from '../../../components/common/Badge';
import { getBMIStatus } from '../../../utils/profileUtils';
import { UserProfile } from '../../../hooks/useProfileData';

interface BodyStatsCardsProps {
  userProfile: UserProfile;
}

export const BodyStatsCards: React.FC<BodyStatsCardsProps> = ({
  userProfile,
}) => {
  const bmiStatus = getBMIStatus(userProfile.bmi);

  return (
    <View style={styles.bodyStatsRow}>
      <Card style={styles.bmiCard}>
        <Text style={styles.cardLabel}>BMI</Text>
        <View style={styles.valueContainer}>
          <Text style={styles.cardValue}>{userProfile.bmi}</Text>
          <Badge
            variant={bmiStatus.color === colors.status.success ? 'success' : 'warning'}
            size="small"
            style={styles.statusBadge}
          >
            {bmiStatus.status}
          </Badge>
        </View>
      </Card>

      <Card style={styles.weightCard}>
        <Text style={styles.cardLabel}>体重変化</Text>
        <View style={styles.valueContainer}>
          <Text style={styles.cardValue}>{userProfile.weight}kg</Text>
          <View style={styles.weightChangeContainer}>
            {userProfile.weight < userProfile.startWeight ? (
              <TrendingDown size={12} color={colors.primary.main} />
            ) : (
              <TrendingUp size={12} color={colors.status.error} />
            )}
            <Text style={[styles.weightChangeText, {
              color: userProfile.weight < userProfile.startWeight 
                ? colors.primary.main 
                : colors.status.error
            }]}>
              {userProfile.weight < userProfile.startWeight ? '-' : '+'}
              {Math.abs(userProfile.weight - userProfile.startWeight).toFixed(1)}kg
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  bodyStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bmiCard: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
  },
  weightCard: {
    flex: 1,
    padding: spacing.lg,
    backgroundColor: colors.gray[50],
  },
  cardLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.xs,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardValue: {
    fontSize: typography.fontSize['2xl'],
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  statusBadge: {
    marginLeft: spacing.sm,
  },
  weightChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  weightChangeText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
});