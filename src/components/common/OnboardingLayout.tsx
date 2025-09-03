import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../design-system';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  onNext?: () => void;
  onBack?: () => void;
  nextButtonText?: string;
  isNextEnabled?: boolean;
  nextButtonDisabled?: boolean;
  isScrollView?: boolean;
  showBackButton?: boolean;
  hideProgress?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  currentStep,
  totalSteps,
  title,
  subtitle,
  onNext,
  onBack,
  nextButtonText = '次へ',
  isNextEnabled = true,
  nextButtonDisabled = false,
  isScrollView = true,
  showBackButton = false,
  hideProgress = false,
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  const ContentWrapper = isScrollView ? ScrollView : View;
  const contentProps = isScrollView
    ? { style: styles.scrollView, showsVerticalScrollIndicator: false }
    : { style: styles.scrollView };

  const content = (
    <>
      {/* Header with Back Button */}
      {!hideProgress && (
        <View style={styles.headerContainer}>
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${progressPercentage}%` }
                ]}
              />
            </View>
            <Text style={styles.progressText}>{currentStep} / {totalSteps}</Text>
          </View>
        </View>
      )}

      {/* Title and Subtitle */}
      <View style={[styles.header, hideProgress && styles.headerNoProgress]}>
        <View style={styles.titleContainer}>
          {showBackButton && onBack && (
            <View style={styles.backButtonWrapper}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={onBack}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                activeOpacity={0.7}
              >
                <ChevronLeft size={24} color={colors.text.primary} />
              </TouchableOpacity>
            </View>
          )}
          <Text style={styles.title}>{title}</Text>
        </View>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {/* Content */}
      {children}

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
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {isScrollView ? (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {content}
        </ScrollView>
      ) : (
        <View style={styles.staticContainer}>
          {content}
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
    // marginBottom: spacing.xxxl,
  },
  headerContainer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.gray[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  progressContainer: {
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
  },
  staticContainer: {
    flex: 1,
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
    position: 'relative',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: spacing.sm,
    minHeight: 44,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text.primary,
    textAlign: 'center',
    flex: 1,
    paddingHorizontal: 60,
  },
  backButtonWrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    zIndex: 10,
    width: 60,
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
  headerNoProgress: {
    paddingTop: spacing.lg,
  },
});