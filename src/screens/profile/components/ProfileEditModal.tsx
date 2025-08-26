import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import {
  User,
  X,
  RefreshCw,
} from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Input } from '../../../components/common/Input';

export interface ProfileData {
  age: number;
  height: number;
  weight: number;
  gender: 'male' | 'female' | 'other';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very-active';
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
  const [profile, setProfile] = useState<ProfileData>(profileData);

  useEffect(() => {
    setProfile(profileData);
  }, [profileData]);

  const handleSave = () => {
    if (profile.age < 10 || profile.age > 100) {
      Alert.alert('エラー', '年齢は10〜100歳の間で入力してください');
      return;
    }

    if (profile.height < 140 || profile.height > 220) {
      Alert.alert('エラー', '身長は140〜220cmの間で入力してください');
      return;
    }

    if (profile.weight < 30 || profile.weight > 200) {
      Alert.alert('エラー', '体重は30〜200kgの間で入力してください');
      return;
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

  // DropdownSelector コンポーネント
  const DropdownSelector = ({ 
    label, 
    value, 
    options, 
    onSelect, 
    displayValue 
  }: {
    label: string;
    value: any;
    options: Array<{ value: any; label: string }>;
    onSelect: (value: any) => void;
    displayValue?: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <View style={styles.dropdownContainer}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={styles.dropdownTrigger}
          onPress={() => setIsOpen(!isOpen)}
        >
          <Text style={styles.dropdownValue}>
            {displayValue || options.find(opt => opt.value === value)?.label || 'Select...'}
          </Text>
          <Text style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        
        {isOpen && (
          <View style={styles.dropdownList}>
            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownItem,
                    value === option.value && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    onSelect(option.value);
                    setIsOpen(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    value === option.value && styles.dropdownItemTextSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
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
            {/* 年齢と身長 */}
            <View style={styles.row}>
              <View style={styles.inputGroup}>
                <DropdownSelector
                  label="年齢"
                  value={profile.age}
                  options={Array.from({ length: 91 }, (_, i) => ({ 
                    value: i + 10, 
                    label: `${i + 10}` 
                  }))}
                  onSelect={(age) => setProfile(prev => ({ ...prev, age }))}
                />
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
    paddingVertical: spacing.lg,
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
    gap: spacing.lg,
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
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  dropdownContainer: {
    marginBottom: spacing.sm,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
  },
  dropdownValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
    flex: 1,
  },
  dropdownArrow: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
  },
  dropdownList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    maxHeight: 200,
    zIndex: 1000,
    ...shadows.md,
  },
  dropdownScroll: {
    maxHeight: 200,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light + '50',
  },
  dropdownItemSelected: {
    backgroundColor: colors.primary[50],
  },
  dropdownItemText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
  },
  dropdownItemTextSelected: {
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
    fontWeight: 'bold',
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  saveButton: {
    backgroundColor: colors.primary.main,
    flexDirection: 'row',
    gap: spacing.sm,
  },
});