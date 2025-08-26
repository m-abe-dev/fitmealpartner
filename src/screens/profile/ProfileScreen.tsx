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
  TrendingDown,
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
import { ProfileEditModal, ProfileData } from './components/ProfileEditModal';

interface UserProfile extends ProfileData {
  name: string;
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
  const [showProfileEditModal, setShowProfileEditModal] = useState(false);

  // モックデータ
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '田中健太',
    age: 28,
    height: 175,
    weight: 71.2,
    gender: 'male',
    activityLevel: 'moderate',
    targetWeight: 68.0,
    targetDate: '2024-06-30',
    goal: 'cut',
    bmi: 23.2,
    startWeight: 74.5,
    joinDate: '2023-11-15'
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

  const calculateBMI = (height: number, weight: number): number => {
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
  };

  const handleProfileSave = (updatedProfile: ProfileData) => {
    const newBMI = calculateBMI(updatedProfile.height, updatedProfile.weight);

    setUserProfile(prev => ({
      ...prev,
      ...updatedProfile,
      bmi: newBMI,
      // targetWeightはユーザーが直接入力した値を使用
      targetWeight: updatedProfile.targetWeight || updatedProfile.weight,
    }));

    Alert.alert('成功', 'プロフィールが更新されました');
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

  const getActivityLevelText = (level: string): string => {
    switch (level) {
      case 'sedentary': return '座りがち（運動なし）';
      case 'light': return '軽い活動（週1-3回）';
      case 'moderate': return '中程度（週3-5回）';
      case 'active': return '活発（週6-7回）';
      case 'very-active': return '非常に活発（1日2回）';
      default: return '未設定';
    }
  };

  const getBMIStatus = (bmi: number): { status: string; color: string } => {
    if (bmi < 18.5) return { status: '低体重', color: colors.status.warning };
    if (bmi < 25) return { status: '標準', color: colors.status.success };
    if (bmi < 30) return { status: '肥満（軽度）', color: colors.status.warning };
    return { status: '肥満（重度）', color: colors.status.error };
  };

  const bmiStatus = getBMIStatus(userProfile.bmi);

  // 詳細な体重分析を計算
  const calculateWeightAnalysis = () => {
    const targetDate = userProfile.targetDate ? new Date(userProfile.targetDate) : null;
    const today = new Date();
    const daysToGoal = targetDate ? Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : 0;

    // 現在体重から目標体重への必要変化量
    const weightChangeToTarget = userProfile.targetWeight - userProfile.weight;
    
    // 目標達成に必要な週数を計算
    const weeksToTarget = daysToGoal > 0 ? daysToGoal / 7 : 0;
    
    // 目標達成のための週間ペース（必要な変化量を残り週数で割る）
    const requiredWeeklyPace = weeksToTarget > 0 ? weightChangeToTarget / weeksToTarget : 0;

    // Harris-Benedict式で基礎代謝を計算
    const calculateBMR = (): number => {
      const { weight, height, age, gender } = userProfile;
      if (gender === 'male') {
        return 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age);
      } else {
        return 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
      }
    };

    // 活動レベル係数
    const getActivityMultiplier = (level: string): number => {
      switch (level) {
        case 'sedentary': return 1.2;
        case 'light': return 1.375;
        case 'moderate': return 1.55;
        case 'active': return 1.725;
        case 'very-active': return 1.9;
        default: return 1.55;
      }
    };

    const bmr = calculateBMR();
    const maintenanceCalories = bmr * getActivityMultiplier(userProfile.activityLevel);

    return {
      daysToGoal,
      weightChange: weightChangeToTarget,
      weeklyPace: requiredWeeklyPace,
      bmr: Math.round(bmr),
      maintenanceCalories: Math.round(maintenanceCalories)
    };
  };

  const analysis = calculateWeightAnalysis();

  // 動的に栄養目標を計算（修正版）
  const calculateNutritionTargets = (): NutritionTargets => {
    const maintenanceCalories = analysis.maintenanceCalories;
    
    // 目標に応じたカロリー調整（より現実的に）
    let targetCalories = maintenanceCalories;
    const weightChangeNeeded = userProfile.targetWeight - userProfile.weight;
    
    if (Math.abs(weightChangeNeeded) > 0.1) {
      // 理論値計算（1kg = 7700kcal）
      const totalKcalChange = weightChangeNeeded * 7700;
      const dailyKcalChange = analysis.daysToGoal > 0 ? totalKcalChange / analysis.daysToGoal : 0;
      
      if (weightChangeNeeded < 0) {
        // 減量の場合
        targetCalories = maintenanceCalories + dailyKcalChange; // dailyKcalChangeは負の値
        // 安全な下限（基礎代謝の1.2倍）
        targetCalories = Math.max(analysis.bmr * 1.2, targetCalories);
      } else {
        // 増量の場合
        targetCalories = maintenanceCalories + dailyKcalChange; // dailyKcalChangeは正の値
        // 現実的な上限（基礎代謝の2.5倍）
        targetCalories = Math.min(analysis.bmr * 2.5, targetCalories);
      }
      
      // 警告レベルの判定（オプション）
      const weeklyPaceKg = Math.abs(analysis.weeklyPace);
      if (weeklyPaceKg > 1.0) {
        console.warn('週1kg以上の体重変化は推奨されません');
      }
    }
    
    // 増量時のタンパク質（体重×1.6-2.2g）
    const getProteinMultiplier = (): number => {
      if (weightChangeNeeded < 0) {
        // 減量時：筋肉維持のため多め
        return 2.0 + (userProfile.activityLevel === 'very-active' ? 0.2 : 0);
      } else if (weightChangeNeeded > 0) {
        // 増量時：筋肉合成に必要な量
        return 1.8 + (userProfile.activityLevel === 'very-active' ? 0.2 : 0);
      }
      return 1.6; // 維持時
    };
    
    const protein = Math.round(userProfile.weight * getProteinMultiplier());
    
    // 脂質：総カロリーの20-30%
    const fatRatio = weightChangeNeeded > 0 ? 0.25 : 0.27; // 増量時は炭水化物を多めに
    const fat = Math.round((targetCalories * fatRatio) / 9);
    
    // 炭水化物：残り
    const carbCalories = targetCalories - (protein * 4) - (fat * 9);
    const carbs = Math.round(Math.max(100, carbCalories / 4));
    
    // カロリーを再計算して調整
    const actualCalories = (protein * 4) + (fat * 9) + (carbs * 4);
    
    return {
      calories: Math.round(actualCalories),
      protein,
      fat,
      carbs
    };
  };
  
  const nutritionTargets = calculateNutritionTargets();

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
            <View style={styles.profileHeader}>
              <View style={styles.profileHeaderLeft}>
                <Text style={styles.profileSectionTitle}>基本情報</Text>
              </View>
              <TouchableOpacity
                style={styles.profileUpdateButton}
                onPress={() => setShowProfileEditModal(true)}
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
                <Text style={styles.userName}>{getActivityLevelText(userProfile.activityLevel)}</Text>
                <Text style={styles.userAge}>{userProfile.age}歳 • {userProfile.height}cm • {userProfile.weight}kg</Text>
                <Text style={styles.joinDate}>
                  {new Date(userProfile.joinDate).toLocaleDateString('ja-JP')} から利用開始
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* BMI・体重カード */}
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
                  color: userProfile.weight < userProfile.startWeight ? colors.primary.main : colors.status.error
                }]}>
                  {userProfile.weight < userProfile.startWeight ? '-' : '+'}
                  {Math.abs(userProfile.weight - userProfile.startWeight).toFixed(1)}kg
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* 目標分析 */}
        <Card style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <View style={styles.goalHeaderLeft}>
              <Target size={20} color={colors.primary.main} />
              <Text style={styles.goalTitle}>目標分析</Text>
            </View>
            {userProfile.targetDate && (
              <View style={styles.targetDateContainer}>
                <Calendar size={14} color={colors.text.secondary} />
                <Text style={styles.targetDateText}>
                  目標日: {new Date(userProfile.targetDate).toLocaleDateString('ja-JP')}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.goalProgress}>
            {/* 体重分析 */}
            <View style={styles.analysisContainer}>
              <View style={styles.analysisRow}>
<View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>目標体重</Text>
                  <Text style={styles.analysisValue}>
                    {userProfile.targetWeight}kg
                  </Text>
                </View>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>目標まで</Text>
                  <Text style={styles.analysisValue}>
                    {analysis.daysToGoal > 0 ? `${analysis.daysToGoal}日` : '目標日未設定'}
                  </Text>
                </View>
              </View>

              <View style={styles.analysisRow}>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>必要な体重変化</Text>
                  <Text style={[styles.analysisValue, {
                    color: analysis.weightChange < 0 ? colors.primary.main : analysis.weightChange > 0 ? colors.status.error : colors.text.primary
                  }]}>
                    {analysis.weightChange >= 0 ? '+' : ''}{analysis.weightChange.toFixed(1)}kg
                  </Text>
                </View>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>必要な週間ペース</Text>
                  <Text style={[styles.analysisValue, {
                    color: analysis.weeklyPace < 0 ? colors.primary.main : analysis.weeklyPace > 0 ? colors.status.error : colors.text.primary
                  }]}>
                    {analysis.weeklyPace >= 0 ? '+' : ''}{analysis.weeklyPace.toFixed(2)}kg/週
                  </Text>
                </View>
              </View>

              <View style={styles.analysisRow}>
                <View style={styles.analysisItem}>
                  <Text style={styles.analysisLabel}>基礎代謝</Text>
                  <Text style={styles.analysisValue}>{analysis.bmr}kcal</Text>
                </View>
                <View style={[styles.analysisItem, styles.analysisItemFull]}>
                  <Text style={styles.analysisLabel}>維持カロリー</Text>
                  <Text style={styles.analysisValue}>{analysis.maintenanceCalories}kcal/日</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* 栄養目標設定 */}
        <Card style={styles.nutritionCard}>
          <View style={styles.nutritionHeader}>
            <Text style={styles.nutritionTitle}>計算された栄養目標</Text>
            <Badge variant="default" size="small" style={styles.autoBadge}>
              {Math.abs(userProfile.targetWeight - userProfile.weight) > 0.1 
                ? (userProfile.targetWeight < userProfile.weight ? '減量用' : '増量用')
                : '維持用'
              }
            </Badge>
          </View>

          {/* 目標カロリーとタンパク質 */}
          <View style={styles.macroRow}>
            <View style={styles.macroItemNew}>
              <Text style={styles.macroLabel}>目標カロリー</Text>
              <Text style={styles.macroValueLarge}>{nutritionTargets.calories}</Text>
              <Text style={styles.macroUnit}>kcal/日</Text>
            </View>
            <View style={styles.macroItemNew}>
              <Text style={styles.macroLabel}>目標タンパク質</Text>
              <Text style={styles.macroValueLarge}>{nutritionTargets.protein}</Text>
              <Text style={styles.macroUnit}>g/日</Text>
            </View>
          </View>

          {/* 脂質と炭水化物 */}
          <View style={styles.macroRow}>
            <View style={styles.macroItemNew}>
              <Text style={styles.macroLabel}>目標炭水化物</Text>
              <Text style={styles.macroValueLarge}>{nutritionTargets.carbs}</Text>
              <Text style={styles.macroUnit}>g/日</Text>
            </View>
            <View style={styles.macroItemNew}>
              <Text style={styles.macroLabel}>目標脂質</Text>
              <Text style={styles.macroValueLarge}>{nutritionTargets.fat}</Text>
              <Text style={styles.macroUnit}>g/日</Text>
            </View>
          </View>

          {/* PFCバランス */}
          <View style={styles.pfcBalanceContainer}>
            <Text style={styles.pfcBalanceTitle}>PFCバランス</Text>
            <View style={styles.pfcBalance}>
              <View
                style={[styles.pfcBar, {
                  backgroundColor: colors.nutrition.protein,
                  flex: (nutritionTargets.protein * 4) / nutritionTargets.calories
                }]}
              />
              <View
                style={[styles.pfcBar, {
                  backgroundColor: colors.nutrition.fat,
                  flex: (nutritionTargets.fat * 9) / nutritionTargets.calories
                }]}
              />
              <View
                style={[styles.pfcBar, {
                  backgroundColor: colors.nutrition.carbs,
                  flex: (nutritionTargets.carbs * 4) / nutritionTargets.calories
                }]}
              />
            </View>
            <View style={styles.pfcLegend}>
              <View style={styles.pfcLegendItem}>
                <View style={[styles.pfcColorDot, { backgroundColor: colors.nutrition.protein }]} />
                <Text style={styles.pfcLegendText}>P: {Math.round((nutritionTargets.protein * 4) / nutritionTargets.calories * 100)}%</Text>
              </View>
              <View style={styles.pfcLegendItem}>
                <View style={[styles.pfcColorDot, { backgroundColor: colors.nutrition.fat }]} />
                <Text style={styles.pfcLegendText}>F: {Math.round((nutritionTargets.fat * 9) / nutritionTargets.calories * 100)}%</Text>
              </View>
              <View style={styles.pfcLegendItem}>
                <View style={[styles.pfcColorDot, { backgroundColor: colors.nutrition.carbs }]} />
                <Text style={styles.pfcLegendText}>C: {Math.round((nutritionTargets.carbs * 4) / nutritionTargets.calories * 100)}%</Text>
              </View>
            </View>
          </View>
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

      {/* プロフィール編集モーダル */}
      <ProfileEditModal
        isVisible={showProfileEditModal}
        onClose={() => setShowProfileEditModal(false)}
        profileData={{
          age: userProfile.age,
          height: userProfile.height,
          weight: userProfile.weight,
          gender: userProfile.gender,
          activityLevel: userProfile.activityLevel,
          targetWeight: userProfile.targetWeight,
          targetDate: userProfile.targetDate,
        }}
        onSave={handleProfileSave}
      />
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
    borderRadius: radius.full,
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
  goalCard: {
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
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
  analysisContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  analysisRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  analysisItem: {
    flex: 1,
  },
  analysisItemFull: {
    flex: 1,
  },
  analysisLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.xs,
  },
  analysisValue: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  goalProgressRemaining: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  goalDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalChangeDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.medium,
    fontWeight: '600',
  },
  targetDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  targetDateText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  nutritionCard: {
    marginBottom: spacing.md,
  },
  nutritionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  nutritionTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
    fontWeight: 'bold',
  },
  autoBadge: {
    backgroundColor: colors.gray[100],
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  macroItemNew: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  macroLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.xs,
  },
  macroValueLarge: {
    fontSize: typography.fontSize['2xl'],
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
    marginBottom: spacing.xxxs,
  },
  macroUnit: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
  },
  pfcBalanceContainer: {
    backgroundColor: colors.gray[50],
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  pfcBalanceTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.sm,
  },
  pfcBalance: {
    flexDirection: 'row',
    height: 8,
    borderRadius: radius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  pfcBar: {
    height: '100%',
  },
  pfcLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pfcLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  pfcColorDot: {
    width: 12,
    height: 12,
    borderRadius: radius.sm,
  },
  pfcLegendText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
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