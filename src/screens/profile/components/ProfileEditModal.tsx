import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import {
  User,
  X,
  RefreshCw,
  Minus,
  Plus,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';
import { DropdownSelector } from '../../../components/common/DropdownSelector';
import { SimpleCalendar } from '../../../components/common/SimpleCalendar';

export interface ProfileData {
  age: number;
  height: number;
  weight: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
  targetWeight?: number;
  targetDate?: string;
  goal?: 'cut' | 'bulk' | 'maintain';
}

interface ProfileEditModalProps {
  isVisible: boolean;
  onClose: () => void;
  profileData: ProfileData;
  onSave: (updatedProfile: ProfileData) => void;
}

export const ProfileEditModal: React.FC<ProfileEditModalProps> = ({
  isVisible,
  onClose,
  profileData,
  onSave,
}) => {
  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Handle date selection
  const handleDateChange = (selectedDate: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0];
      setProfile(prev => ({ ...prev, targetDate: dateString }));
    }
  };

  // Show calendar picker
  const showCalendarPicker = () => {
    setShowDatePicker(true);
  };

  // Handle calendar date selection
  const handleCalendarDateSelect = (dateString: string) => {
    const selectedDate = new Date(dateString);
    handleDateChange(selectedDate);
  };

  // Get minimum date (today)
  const getMinDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  const [profile, setProfile] = useState<ProfileData>({
    ...profileData,
    targetWeight: profileData.targetWeight || profileData.weight || 70,
    targetDate: profileData.targetDate || getTodayDate(),
    goal: profileData.goal || 'maintain',
  });

  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    setProfile({
      ...profileData,
      targetWeight: profileData.targetWeight || profileData.weight || 70,
      targetDate: profileData.targetDate || getTodayDate(),
      goal: profileData.goal || 'maintain',
    });
  }, [profileData]);

  // 目標変更時の自動体重調整
  useEffect(() => {
    const currentWeight = profile.weight || 70;
    const currentGoal = profile.goal;

    // 目標が変更された場合の自動調整ロジック
    if (currentGoal === 'maintain') {
      // 維持の場合は現在の体重に設定
      setProfile(prev => ({ ...prev, targetWeight: currentWeight }));
    } else if (currentGoal === 'cut' && profile.targetWeight && profile.targetWeight >= currentWeight) {
      // 減量目標なのに目標体重が現在体重以上の場合、適切な値に調整
      const adjustedWeight = Math.max(30, currentWeight - 5);
      setProfile(prev => ({ ...prev, targetWeight: adjustedWeight }));
    } else if (currentGoal === 'bulk' && profile.targetWeight && profile.targetWeight <= currentWeight) {
      // 増量目標なのに目標体重が現在体重以下の場合、適切な値に調整
      const adjustedWeight = Math.min(200, currentWeight + 5);
      setProfile(prev => ({ ...prev, targetWeight: adjustedWeight }));
    }
  }, [profile.goal, profile.weight]);

  const handleSave = () => {
    // 基本項目のバリデーション
    if (!profile.height || profile.height < 140 || profile.height > 220) {
      Alert.alert('入力エラー', '身長は140〜220cmの間で選択してください');
      return;
    }

    if (!profile.weight || profile.weight < 30 || profile.weight > 200) {
      Alert.alert('入力エラー', '体重は30〜200kgの間で選択してください');
      return;
    }

    if (!profile.gender) {
      Alert.alert('入力エラー', '性別を選択してください');
      return;
    }

    if (!profile.activityLevel) {
      Alert.alert('入力エラー', '活動レベルを選択してください');
      return;
    }

    // 目標が維持以外の場合のみ目標体重と目標日をチェック
    if (profile.goal !== 'maintain') {
      if (!profile.targetWeight || profile.targetWeight < 30 || profile.targetWeight > 200) {
        Alert.alert('入力エラー', '目標体重は30〜200kgの間で選択してください');
        return;
      }

      if (!profile.targetDate) {
        Alert.alert('入力エラー', '目標達成日を選択してください');
        return;
      }

      const targetDate = new Date(profile.targetDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (targetDate < today) {
        Alert.alert('入力エラー', '目標達成日は今日以降の日付を選択してください');
        return;
      }

      // 極端な体重変化の警告チェック
      const weightChange = Math.abs(profile.targetWeight - profile.weight);
      const daysDiff = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const weeklyChange = (weightChange * 7) / daysDiff;

      // 週間の推奨体重変化率：減量時0.5-1kg、増量時0.25-0.5kg
      let warningMessage = '';
      if (profile.goal === 'cut' && weeklyChange > 1.5) {
        warningMessage = `設定された目標では週に約${weeklyChange.toFixed(1)}kgの減量が必要です。\n\n推奨される健康的な減量ペースは週0.5〜1kg程度です。\n\n期間を延ばすか、目標体重を調整することをお勧めします。\n\n現在の設定で続けますか？`;
      } else if (profile.goal === 'bulk' && weeklyChange > 0.8) {
        warningMessage = `設定された目標では週に約${weeklyChange.toFixed(1)}kgの増量が必要です。\n\n推奨される健康的な増量ペースは週0.25〜0.5kg程度です。\n\n期間を延ばすか、目標体重を調整することをお勧めします。\n\n現在の設定で続けますか？`;
      } else if (daysDiff < 14 && weightChange > 2) {
        warningMessage = `2週間未満で${weightChange.toFixed(1)}kgの体重変化は健康上推奨されません。\n\n期間を延ばすか、目標体重を調整することをお勧めします。\n\n現在の設定で続けますか？`;
      }

      if (warningMessage) {
        return new Promise((resolve) => {
          Alert.alert(
            '体重変化についての注意',
            warningMessage,
            [
              {
                text: 'キャンセル',
                style: 'cancel',
                onPress: () => resolve(false)
              },
              {
                text: '続ける',
                style: 'default',
                onPress: () => {
                  onSave(profile);
                  onClose();
                  resolve(true);
                }
              }
            ]
          );
        });
      }
    }

    onSave(profile);
    onClose();
  };

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return '男性';
      case 'female': return '女性';
      case 'other': return 'その他';
      default: return '';
    }
  };

  const getActivityLabel = (level: string) => {
    switch (level) {
      case 'sedentary': return '座りがち（運動なし）';
      case 'light': return '軽い活動（週1-3回）';
      case 'moderate': return '中程度（週3-5回）';
      case 'active': return '活発（週6-7回）';
      case 'very-active': return '非常に活発（1日2回）';
      default: return '';
    }
  };

  const genderOptions = [
    { value: 'male', label: '男性' },
    { value: 'female', label: '女性' },
    { value: 'other', label: 'その他' },
  ];

  const activityOptions = [
    { value: 'sedentary', label: '座りがち（運動なし）' },
    { value: 'light', label: '軽い活動（週1-3回）' },
    { value: 'moderate', label: '中程度（週3-5回）' },
    { value: 'active', label: '活発（週6-7回）' },
    { value: 'very-active', label: '非常に活発（1日2回）' },
  ];

  const goalOptions = [
    { value: 'cut', label: '減量' },
    { value: 'bulk', label: '増量' },
    { value: 'maintain', label: '維持' },
  ];

  // 目標体重のオプションを動的に生成する関数
  const getTargetWeightOptions = () => {
    const currentWeight = profile.weight || 70;

    if (profile.goal === 'cut') {
      // 減量の場合：現在の体重-0.5kgから30kgまで
      const options = [];
      for (let weight = currentWeight - 0.5; weight >= 30; weight -= 0.5) {
        options.push({
          value: Math.round(weight * 10) / 10,
          label: `${Math.round(weight * 10) / 10}kg`
        });
      }
      return options;
    } else if (profile.goal === 'bulk') {
      // 増量の場合：現在の体重+0.5kgから200kgまで
      const options = [];
      for (let weight = currentWeight + 0.5; weight <= 200; weight += 0.5) {
        options.push({
          value: Math.round(weight * 10) / 10,
          label: `${Math.round(weight * 10) / 10}kg`
        });
      }
      return options;
    } else {
      // 維持の場合：現在の体重のみ
      return [{ value: currentWeight, label: `${currentWeight}kg` }];
    }
  };



  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Card style={styles.headerCard}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <User size={20} color={colors.primary.main} />
              <Text style={styles.headerTitle}>基本情報</Text>
            </View>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>
        </Card>

        <View style={styles.content}>
          <View style={styles.formContainer}>
            {/* 年齢（表示のみ）と身長 */}
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>年齢</Text>
                <View style={styles.readOnlyContainer}>
                  <Text style={styles.readOnlyValue}>{profile.age}歳</Text>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <DropdownSelector
                  label="身長 (cm)"
                  value={profile.height}
                  options={Array.from({ length: 81 }, (_, i) => ({
                    value: i + 140,
                    label: `${i + 140}cm`
                  }))}
                  onSelect={(height) => setProfile(prev => ({ ...prev, height }))}
                />
              </View>
            </View>

            {/* 体重と性別 */}
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <DropdownSelector
                  label="体重 (kg)"
                  value={profile.weight}
                  options={Array.from({ length: 171 }, (_, i) => ({
                    value: i + 30,
                    label: `${i + 30}kg`
                  }))}
                  onSelect={(weight) => setProfile(prev => ({ ...prev, weight }))}
                />
              </View>
              <View style={styles.inputGroup}>
                <DropdownSelector
                  label="性別"
                  value={profile.gender}
                  options={genderOptions}
                  onSelect={(gender) => setProfile(prev => ({ ...prev, gender }))}
                />
              </View>
            </View>

            {/* 活動レベル */}
            <View style={styles.fullWidthGroup}>
              <DropdownSelector
                label="活動レベル"
                value={profile.activityLevel}
                options={activityOptions}
                onSelect={(activityLevel) => setProfile(prev => ({ ...prev, activityLevel }))}
              />
            </View>

            {/* 体重変化の目標 */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>体重変化の目標</Text>

              {/* 目標タイプ */}
              <View style={styles.fullWidthGroup}>
                <DropdownSelector
                  label="目標"
                  value={profile.goal || 'maintain'}
                  options={goalOptions}
                  onSelect={(goal) => setProfile(prev => ({ ...prev, goal }))}
                  helpText={
                    profile.goal === 'cut' ? '週0.5〜1kg減が推奨' :
                    profile.goal === 'bulk' ? '週0.25〜0.5kg増が推奨' :
                    profile.goal === 'maintain' ? '現在の体重を維持' : ''
                  }
                />
              </View>

              {/* 目標が維持以外の場合のみ表示 */}
              {profile.goal !== 'maintain' && (
                <>
                  <View style={styles.fullWidthGroup}>
                    <DropdownSelector
                      label="目標体重 (kg)"
                      value={profile.targetWeight || profile.weight}
                      options={getTargetWeightOptions()}
                      onSelect={(targetWeight) => setProfile(prev => ({ ...prev, targetWeight }))}
                      helpText={`現在: ${profile.weight}kg`}
                    />
                  </View>

                  <View style={styles.fullWidthGroup}>
                    <Text style={styles.goalLabel}>目標達成日</Text>
                    <TouchableOpacity
                      style={styles.dateInput}
                      onPress={showCalendarPicker}
                    >
                      <Calendar size={16} color={colors.text.secondary} />
                      <Text style={styles.dateText}>
                        {profile.targetDate ? new Date(profile.targetDate).toLocaleDateString('ja-JP') : '選択してください'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="更新"
            onPress={handleSave}
            style={styles.saveButton}
            icon={<RefreshCw size={16} color={colors.text.inverse} />}
          />
        </View>

        {/* Calendar Date Picker Modal */}
        {showDatePicker && (
          <Modal
            transparent={true}
            animationType="slide"
            visible={showDatePicker}
            onRequestClose={() => setShowDatePicker(false)}
          >
            <View style={styles.calendarOverlay}>
              <View style={styles.calendarContainer}>
                <View style={styles.calendarHeader}>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.calendarHeaderButton}
                  >
                    <Text style={styles.calendarCancel}></Text>
                  </TouchableOpacity>
                  <View style={styles.calendarTitleContainer}>
                    <Text style={styles.calendarTitle}>目標日を選択</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    style={styles.calendarHeaderButton}
                  >
                    <Text style={styles.calendarDone}>完了</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.calendarContent}>
                  <SimpleCalendar
                    selectedDate={profile.targetDate}
                    onDateSelect={handleCalendarDateSelect}
                    minDate={getMinDate()}
                    showYearSelector={false}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray[100],
  },
  headerCard: {
    borderRadius: 0,
    marginBottom: 0,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  formContainer: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  inputGroup: {
    flex: 1,
  },
  fullWidthGroup: {
    width: '100%',
    marginBottom: spacing.xs,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.xs,
  },
  readOnlyContainer: {
    height: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray[100],
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    justifyContent: 'center',
  },
  readOnlyValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
    marginBottom: spacing.md,
  },
  saveButton: {
    backgroundColor: colors.primary.main,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  // Goal section styles
  sectionContainer: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  goalRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  goalInputGroup: {
    flex: 1,
     marginBottom: spacing.xs,
  },
  goalLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.xs,
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  dateText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
    flex: 1,
  },
  // Calendar Picker Styles
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarContainer: {
    backgroundColor: colors.background.primary,
    borderRadius: radius.lg,
    margin: spacing.md,
    maxWidth: 400,
    width: '95%',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  calendarHeaderButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    width: 90,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarCancel: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
  },
  calendarTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  calendarDone: {
    fontSize: typography.fontSize.base,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  calendarContent: {
    padding: spacing.lg,
  },
});