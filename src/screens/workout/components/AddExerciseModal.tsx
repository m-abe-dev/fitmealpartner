import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { X, Plus, ChevronDown } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius, shadows } from '../../../design-system';
import { categories } from '../data/mockData';

const { width: screenWidth } = Dimensions.get('window');

interface AddExerciseModalProps {
  isVisible: boolean;
  onClose: () => void;
  onAddExercise: (category: string, exerciseName: string) => void;
}

export const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  isVisible,
  onClose,
  onAddExercise
}) => {
  const [selectedCategoryOption, setSelectedCategoryOption] = useState<string>('');
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [newExerciseName, setNewExerciseName] = useState('');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  const handleAddExercise = () => {
    let finalCategory = selectedCategoryOption;

    if (selectedCategoryOption === 'new_category') {
      if (!customCategoryInput.trim()) {
        Alert.alert('エラー', '新しい部位名を入力してください');
        return;
      }
      finalCategory = customCategoryInput.trim();
    }

    if (!finalCategory) {
      Alert.alert('エラー', '部位を選択してください');
      return;
    }

    if (!newExerciseName.trim()) {
      Alert.alert('エラー', '種目名を入力してください');
      return;
    }

    onAddExercise(finalCategory, newExerciseName.trim());
    handleClose();
  };

  const handleClose = () => {
    setSelectedCategoryOption('');
    setCustomCategoryInput('');
    setNewExerciseName('');
    setShowCategoryPicker(false);
    onClose();
  };

  const CategoryPicker = () => (
    <View style={styles.dropdownContainer}>
      <ScrollView
        style={styles.dropdownScrollView}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
        <TouchableOpacity
          style={[
            styles.dropdownOption,
            selectedCategoryOption === 'new_category' && styles.dropdownOptionSelected
          ]}
          onPress={() => {
            setSelectedCategoryOption('new_category');
            setShowCategoryPicker(false);
          }}
        >
          <Text style={[
            styles.dropdownOptionText,
            selectedCategoryOption === 'new_category' && styles.dropdownOptionTextSelected
          ]}>
            新しく追加する
          </Text>
        </TouchableOpacity>
        {categories.map((category, index) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.dropdownOption,
              selectedCategoryOption === category && styles.dropdownOptionSelected,
              index === categories.length - 1 && styles.lastDropdownOption
            ]}
            onPress={() => {
              setSelectedCategoryOption(category);
              setCustomCategoryInput('');
              setShowCategoryPicker(false);
            }}
          >
            <Text style={[
              styles.dropdownOptionText,
              selectedCategoryOption === category && styles.dropdownOptionTextSelected
            ]}>
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableWithoutFeedback onPress={() => {
        Keyboard.dismiss();
        setShowCategoryPicker(false);
      }}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalContent}>
          {/* Header */}
          <LinearGradient
            colors={['#EFF6FF', '#E0E7FF', '#F3E8FF']}
            style={styles.modalHeader}
          >
            <View style={styles.headerDecorationContainer}>
              <View style={styles.headerDecoration} />
            </View>

            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <Text style={styles.modalTitle}>新しく部位・種目を追加</Text>
                <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                  <X size={20} color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                トレーニング部位と種目を選択して登録してください
              </Text>

              <TouchableOpacity
                onPress={handleAddExercise}
                style={styles.registerButton}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.registerGradient}
                >
                  <Plus size={16} color="white" />
                  <Text style={styles.registerButtonText}>登録する</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Form Content */}
          <View style={styles.formContent}>
            {/* Category Selection */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>部位</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowCategoryPicker(!showCategoryPicker)}
              >
                <Text style={[
                  styles.selectButtonText,
                  selectedCategoryOption && styles.selectButtonTextSelected
                ]}>
                  {selectedCategoryOption === 'new_category'
                    ? '新しく追加する'
                    : selectedCategoryOption || '部位を選択してください'
                  }
                </Text>
                <ChevronDown size={20} color={colors.text.tertiary} />
              </TouchableOpacity>

              {showCategoryPicker && <CategoryPicker />}

              {selectedCategoryOption === 'new_category' && (
                <View style={styles.customCategoryContainer}>
                  <TextInput
                    style={styles.textInput}
                    value={customCategoryInput}
                    onChangeText={setCustomCategoryInput}
                    placeholder="新しい部位名を入力"
                    placeholderTextColor={colors.text.tertiary}
                  />
                </View>
              )}
            </View>

            {/* Exercise Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>種目</Text>
              <TextInput
                style={styles.textInput}
                value={newExerciseName}
                onChangeText={setNewExerciseName}
                placeholder="種目名を入力"
                placeholderTextColor={colors.text.tertiary}
              />
            </View>
          </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 140, // 上部から60ptの位置に配置
    paddingBottom: spacing.xl,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: radius.xl,
    maxWidth: screenWidth * 0.85,
    width: '100%',
    // overflow: 'hidden', // ドロップダウンが表示されるように削除
    ...shadows.xl,
  },
  modalHeader: {
    position: 'relative',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    paddingBottom: spacing.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    overflow: 'hidden',
  },
  headerDecorationContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 128,
    height: 128,
    opacity: 0.1,
  },
  headerDecoration: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 64,
    transform: [{ scale: 3 }],
  },
  headerContent: {
    position: 'relative',
    zIndex: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  iconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
    flex: 1,
  },
  closeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: typography.fontSize.sm * 1.4,
  },
  registerButton: {
    alignSelf: 'center',
  },
  registerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  registerButtonText: {
    fontSize: typography.fontSize.sm,
    color: 'white',
    fontFamily: typography.fontFamily.medium,
  },
  formContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.md,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    backgroundColor: 'white',
  },
  formGroup: {
    gap: spacing.sm,
    position: 'relative',
  },
  formLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.medium,
  },
  selectButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
  },
  selectButtonTextSelected: {
    color: colors.text.primary,
  },
  dropdownContainer: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    maxHeight: 250, // ドロップダウンの最大高さを拡大
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  dropdownScrollView: {
    maxHeight: 250,
  },
  dropdownOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md, // パディングを少し大きく
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  lastDropdownOption: {
    borderBottomWidth: 0,
  },
  dropdownOptionSelected: {
    backgroundColor: colors.primary[50],
  },
  dropdownOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  dropdownOptionTextSelected: {
    color: colors.primary.main,
    fontFamily: typography.fontFamily.medium,
  },
  customCategoryContainer: {
    marginTop: spacing.sm,
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    minHeight: 44,
  },
});