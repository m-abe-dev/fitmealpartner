import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { Check, X, Plus, Minus } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../design-system';
import { Food } from '../../screens/nutrition/types/nutrition.types';

interface ScanResultModalProps {
  isVisible: boolean;
  product: Food | null;
  onConfirm: (product: Food, amount: number) => void;
  onCancel: () => void;
}

export const ScanResultModal: React.FC<ScanResultModalProps> = ({
  isVisible,
  product,
  onConfirm,
  onCancel,
}) => {
  const [amount, setAmount] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);

  // モーダルが開かれるたびにamountをリセット
  React.useEffect(() => {
    if (isVisible) {
      setAmount(100);
      setIsProcessing(false);
    }
  }, [isVisible]);

  if (!product) return null;

  const handleConfirm = async () => {
    if (isProcessing) return; // 二重送信防止

    setIsProcessing(true);
    try {
      await onConfirm(product, amount);
    } catch (error) {
      console.error('Error in ScanResultModal confirm:', error);
      setIsProcessing(false);
    }
  };

  const adjustedNutrition = {
    calories: Math.round((product.calories * amount) / 100),
    protein: Math.round((product.protein * amount) / 100 * 10) / 10,
    fat: Math.round((product.fat * amount) / 100 * 10) / 10,
    carbs: Math.round((product.carbs * amount) / 100 * 10) / 10,
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onCancel}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>商品情報</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <X size={24} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <Text style={styles.productName}>{product.name}</Text>

          <View style={styles.amountSection}>
            <Text style={styles.sectionTitle}>分量</Text>
            <View style={styles.amountControl}>
              <TouchableOpacity
                onPress={() => setAmount(Math.max(10, amount - 10))}
                style={styles.amountButton}
              >
                <Minus size={20} color={colors.primary.main} />
              </TouchableOpacity>

              <Text style={styles.amountText}>{amount}g</Text>

              <TouchableOpacity
                onPress={() => setAmount(amount + 10)}
                style={styles.amountButton}
              >
                <Plus size={20} color={colors.primary.main} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.nutritionSection}>
            <Text style={styles.sectionTitle}>栄養成分（{amount}g）</Text>

            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>カロリー</Text>
                <Text style={styles.nutritionValue}>{adjustedNutrition.calories}</Text>
                <Text style={styles.nutritionUnit}>kcal</Text>
              </View>

              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>タンパク質</Text>
                <Text style={styles.nutritionValue}>{adjustedNutrition.protein}</Text>
                <Text style={styles.nutritionUnit}>g</Text>
              </View>

              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>脂質</Text>
                <Text style={styles.nutritionValue}>{adjustedNutrition.fat}</Text>
                <Text style={styles.nutritionUnit}>g</Text>
              </View>

              <View style={styles.nutritionItem}>
                <Text style={styles.nutritionLabel}>炭水化物</Text>
                <Text style={styles.nutritionValue}>{adjustedNutrition.carbs}</Text>
                <Text style={styles.nutritionUnit}>g</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.cancelButton, isProcessing && styles.disabledButton]}
            onPress={onCancel}
            disabled={isProcessing}
          >
            <Text style={styles.cancelButtonText}>キャンセル</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.confirmButton, isProcessing && styles.disabledButton]}
            onPress={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Text style={styles.confirmButtonText}>追加中...</Text>
            ) : (
              <>
                <Check size={20} color="white" />
                <Text style={styles.confirmButtonText}>追加する</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  productName: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  amountSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  amountControl: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  amountButton: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountText: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    minWidth: 80,
    textAlign: 'center',
  },
  nutritionSection: {
    marginBottom: spacing.xl,
  },
  nutritionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  nutritionItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.background.secondary,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  nutritionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  nutritionValue: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
  },
  nutritionUnit: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    marginBottom: spacing.xl,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.gray[200],
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: colors.text.secondary,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary.main,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: typography.fontSize.base,
    fontFamily: typography.fontFamily.medium,
    color: 'white',
  },
  disabledButton: {
    opacity: 0.5,
  },
});