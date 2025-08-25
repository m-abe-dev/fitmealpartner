import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {

  Crown,
  User,
  Target,
  Activity,
  Smartphone,
  Settings,
  ChevronRight,
  Edit3,
  TrendingUp,
  Calendar,
  Award,
  Bell
} from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';
import { ScreenHeader } from '../../components/common/ScreenHeader';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Progress } from '../../components/common/Progress';
import { Badge } from '../../components/common/Badge';

interface UserProfile {
  name: string;
  age: number;
  height: number;
  weight: number;
  goal: 'cut' | 'bulk' | 'maintain';
  bmi: number;
  targetWeight: number;
  startWeight: number;
  joinDate: string;
}

interface NutritionTargets {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface DeviceConnection {
  name: string;
  type: 'fitness' | 'health' | 'smart_scale';
  connected: boolean;
  icon: string;
}

export const ProfileScreen: React.FC = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);

  // モックデータ
  const [userProfile] = useState<UserProfile>({
    name: '田中健太',
    age: 28,
    height: 175,
    weight: 71.2,
    goal: 'cut',
    bmi: 23.2,
    targetWeight: 68.0,
    startWeight: 74.5,
    joinDate: '2023-11-15'
  });

  const [nutritionTargets] = useState<NutritionTargets>({
    calories: 2200,
    protein: 140,
    fat: 85,
    carbs: 200
  });

  const [deviceConnections] = useState<DeviceConnection[]>([
    { name: 'Apple Watch', type: 'fitness', connected: true, icon: '⌚' },
    { name: 'iPhone ヘルスケア', type: 'health', connected: true, icon: '📱' },
    { name: 'スマート体重計', type: 'smart_scale', connected: false, icon: '⚖️' },
    { name: 'MyFitnessPal', type: 'fitness', connected: false, icon: '📊' }
  ]);

  const [achievements] = useState([
    { id: 1, title: '7日連続記録', description: '食事を7日間連続で記録しました', icon: '🔥', unlocked: true },
    { id: 2, title: '目標体重達成', description: '目標体重に到達しました', icon: '🎯', unlocked: false },
    { id: 3, title: 'プロテイン王', description: 'タンパク質目標を30日連続達成', icon: '💪', unlocked: true },
    { id: 4, title: 'ワークアウト達人', description: '月20回のワークアウトを達成', icon: '🏆', unlocked: false }
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getGoalText = (goal: string): string => {
    switch (goal) {
      case 'cut': return '減量';
      case 'bulk': return '増量';
      case 'maintain': return '維持';
      default: return '未設定';
    }
  };

  const getGoalColor = (goal: string): string => {
    switch (goal) {
      case 'cut': return colors.status.error;
      case 'bulk': return colors.status.success;
      case 'maintain': return colors.primary.main;
      default: return colors.text.secondary;
    }
  };

  const getBMIStatus = (bmi: number): { status: string; color: string } => {
    if (bmi < 18.5) return { status: '低体重', color: colors.status.warning };
    if (bmi < 25) return { status: '標準', color: colors.status.success };
    if (bmi < 30) return { status: '肥満（軽度）', color: colors.status.warning };
    return { status: '肥満（重度）', color: colors.status.error };
  };

  const bmiStatus = getBMIStatus(userProfile.bmi);

  const weightProgress = Math.abs(userProfile.weight - userProfile.startWeight) / Math.abs(userProfile.targetWeight - userProfile.startWeight) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="プロフィール"
        icon={<User size={24} color={colors.primary.main} />}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* プロフィールヘッダー */}
        <Card style={styles.profileCard}>
          <View style={styles.profileGradient}>
            <View style={styles.profileInfo}>
              <View style={styles.avatarContainer}>
                <User size={40} color={colors.text.inverse} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{userProfile.name}</Text>
                <Text style={styles.userAge}>{userProfile.age}歳 • {userProfile.height}cm</Text>
                <Text style={styles.joinDate}>
                  {new Date(userProfile.joinDate).toLocaleDateString('ja-JP')} から利用開始
                </Text>
              </View>
              <TouchableOpacity style={styles.editButton}>
                <Edit3 size={20} color={colors.text.inverse} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>

        {/* BMI・体重カード */}
        <View style={styles.bodyStatsRow}>
          <Card style={styles.bmiCard}>
            <Text style={styles.bmiTitle}>BMI</Text>
            <Text style={styles.bmiValue}>{userProfile.bmi}</Text>
            <Badge
              variant={bmiStatus.color === colors.status.success ? 'success' : 'warning'}
              size="small"
              style={styles.bmiBadge}
            >
              {bmiStatus.status}
            </Badge>
          </Card>

          <Card style={styles.weightCard}>
            <Text style={styles.weightTitle}>現在の体重</Text>
            <Text style={styles.weightValue}>{userProfile.weight}kg</Text>
            <Text style={styles.weightChange}>
              {userProfile.weight < userProfile.startWeight ? '-' : '+'}
              {Math.abs(userProfile.weight - userProfile.startWeight).toFixed(1)}kg
            </Text>
          </Card>
        </View>

        {/* 目標進捗 */}
        <Card style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View style={styles.goalHeaderLeft}>
              <Target size={20} color={colors.primary.main} />
              <Text style={styles.goalTitle}>目標進捗</Text>
            </View>
            <Badge
              variant={getGoalColor(userProfile.goal) === colors.status.success ? 'success' : 'default'}
              size="small"
            >
              {getGoalText(userProfile.goal)}
            </Badge>
          </View>

          <View style={styles.goalProgress}>
            <View style={styles.goalProgressHeader}>
              <Text style={styles.goalProgressText}>
                目標体重: {userProfile.targetWeight}kg
              </Text>
              <Text style={styles.goalProgressPercentage}>
                {Math.round(weightProgress)}%
              </Text>
            </View>
            <Progress
              value={weightProgress}
              max={100}
              color={getGoalColor(userProfile.goal)}
              style={styles.progressBar}
            />
            <Text style={styles.goalProgressRemaining}>
              残り {Math.abs(userProfile.weight - userProfile.targetWeight).toFixed(1)}kg
            </Text>
          </View>
        </Card>

        {/* PFCバランス */}
        <Card style={styles.nutritionCard}>
          <Text style={styles.nutritionTitle}>栄養目標設定</Text>
          <View style={styles.nutritionTargets}>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>カロリー</Text>
                <Text style={styles.macroValue}>{nutritionTargets.calories}</Text>
                <Text style={styles.macroUnit}>kcal</Text>
              </View>
              <View style={styles.macroSeparator} />
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>タンパク質</Text>
                <Text style={styles.macroValue}>{nutritionTargets.protein}</Text>
                <Text style={styles.macroUnit}>g</Text>
              </View>
            </View>
            <View style={styles.macroRow}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>脂質</Text>
                <Text style={styles.macroValue}>{nutritionTargets.fat}</Text>
                <Text style={styles.macroUnit}>g</Text>
              </View>
              <View style={styles.macroSeparator} />
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>炭水化物</Text>
                <Text style={styles.macroValue}>{nutritionTargets.carbs}</Text>
                <Text style={styles.macroUnit}>g</Text>
              </View>
            </View>
          </View>
          <Button
            title="栄養目標を編集"
            variant="outline"
            onPress={() => {}}
            style={styles.editNutritionButton}
          />
        </Card>

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
              <Settings size={20} color={colors.text.secondary} />
              <Text style={styles.settingItemText}>一般設定</Text>
            </View>
            <ChevronRight size={20} color={colors.text.tertiary} />
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>FitMeal Partner v1.0.0</Text>
          <Text style={styles.footerText}>© 2024 FitMeal Partner</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconButton: {
    padding: spacing.xs,
  },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    gap: spacing.xxs,
  },
  proButtonText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  profileCard: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  profileGradient: {
    backgroundColor: colors.primary.main,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: radius.full,
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
  editButton: {
    padding: spacing.sm,
  },
  bodyStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bmiCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
  },
  bmiTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.xs,
  },
  bmiValue: {
    fontSize: typography.fontSize['2xl'],
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.xs,
  },
  bmiBadge: {
    alignSelf: 'center',
  },
  weightCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
  },
  weightTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.xs,
  },
  weightValue: {
    fontSize: typography.fontSize['2xl'],
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.xs,
  },
  weightChange: {
    fontSize: typography.fontSize.sm,
    color: colors.status.success,
    fontFamily: typography.fontFamily.bold,
  },
  goalCard: {
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  goalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  goalTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  goalProgress: {
    gap: spacing.sm,
  },
  goalProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalProgressText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  goalProgressPercentage: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.bold,
  },
  progressBar: {
    marginVertical: spacing.xs,
  },
  goalProgressRemaining: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  nutritionCard: {
    marginBottom: spacing.md,
  },
  nutritionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.md,
  },
  nutritionTargets: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  macroLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  macroValue: {
    fontSize: typography.fontSize.xl,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
  },
  macroUnit: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
  },
  macroSeparator: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.md,
  },
  editNutritionButton: {
    alignSelf: 'center',
  },
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
    borderRadius: radius.md,
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
    borderRadius: radius.md,
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
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    gap: spacing.xs,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
  },
});