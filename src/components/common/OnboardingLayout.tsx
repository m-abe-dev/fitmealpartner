import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '../../design-system';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  onNext?: () => void;
  nextButtonText?: string;
  isNextEnabled?: boolean;
  nextButtonDisabled?: boolean;
  isScrollView?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  currentStep,
  totalSteps,
  title,
  subtitle,
  onNext,
  nextButtonText = '次へ',
  isNextEnabled = true,
  nextButtonDisabled = false,
  isScrollView = true,
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  const ContentWrapper = isScrollView ? ScrollView : View;
  const contentProps = isScrollView
    ? { style: styles.scrollView, showsVerticalScrollIndicator: false }
    : { style: styles.scrollView };

  return (
    <SafeAreaView style={styles.container}>
      <ContentWrapper {...contentProps}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>{currentStep} / {totalSteps}</Text>
        </View>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            {subtitle}
          </Text>
        </View>

        {/* Content */}
        {children}
      </ContentWrapper>

      {/* Next Button */}
      {onNext && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              (!isNextEnabled || nextButtonDisabled) && styles.nextButtonDisabled
            ]}
            onPress={onNext}
            disabled={!isNextEnabled || nextButtonDisabled}
          >
            <Text style={[
              styles.nextButtonText,
              (!isNextEnabled || nextButtonDisabled) && styles.nextButtonTextDisabled
            ]}>
              {nextButtonText}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
    marginBottom: spacing.xxxl,
  },
  progressContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary.main,
    borderRadius: 2,
  },
  progressText: {
    marginTop: spacing.sm,
    fontSize: typography.fontSize.sm,
    color: colors.gray[600],
    fontFamily: typography.fontFamily.medium,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: spacing.xl,
    // paddingBottom: spacing.xl,
    // marginTop: spacing.lg,
  },
  nextButton: {
    backgroundColor: colors.primary.main,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  nextButtonText: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.background.primary,
  },
  nextButtonTextDisabled: {
    color: colors.gray[500],
  },
});