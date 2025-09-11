import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing, radius, shadows } from '../../design-system';

interface DropdownOption {
  value: any;
  label: string;
}

interface DropdownSelectorProps {
  label?: string;
  value: any;
  options: DropdownOption[];
  onSelect: (value: any) => void;
  placeholder?: string;
  defaultScrollToValue?: number | string;
  helpText?: string;
}

export const DropdownSelector: React.FC<DropdownSelectorProps> = ({
  label,
  value,
  options,
  onSelect,
  placeholder = "選択してください",
  defaultScrollToValue = 65,
  helpText,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isOpen && scrollViewRef.current) {
      const targetValue = value || defaultScrollToValue;
      const index = options.findIndex(opt => opt.value === targetValue);

      if (index !== -1) {
        const itemHeight = 44;
        const scrollPosition = Math.max(0, (index - 2) * itemHeight);

        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: false });
        }, 100);
      }
    }
  }, [isOpen, value, options, defaultScrollToValue]);

  return (
    <View style={styles.dropdownContainer}>
      {/* ラベルとヘルプテキストを同じ行に配置 */}
      {(label || helpText) && (
        <View style={styles.labelContainer}>
          {label && <Text style={styles.label}>{label}</Text>}
          {helpText && <Text style={styles.helpText}>{helpText}</Text>}
        </View>
      )}
      <TouchableOpacity
        style={[
          styles.dropdownTrigger,
          !value && styles.dropdownTriggerEmpty
        ]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={[
          styles.dropdownValue,
          !value && styles.dropdownValuePlaceholder
        ]}>
          {value ? options.find(opt => opt.value === value)?.label : placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.dropdownList}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.dropdownScroll}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.dropdownItem,
                  value === option.value && styles.dropdownItemSelected,
                  !value && option.value === defaultScrollToValue && styles.dropdownItemDefault
                ]}
                onPress={() => {
                  onSelect(option.value);
                  setIsOpen(false);
                }}
              >
                <Text style={[
                  styles.dropdownItemText,
                  value === option.value && styles.dropdownItemTextSelected,
                  !value && option.value === defaultScrollToValue && styles.dropdownItemTextDefault
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

const styles = StyleSheet.create({
  dropdownContainer: {
    marginBottom: 0,
    position: 'relative',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.medium,
  },
  helpText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
    fontStyle: 'italic',
    flex: 1,
    textAlign: 'right',
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
  dropdownTriggerEmpty: {
    borderColor: colors.border.medium,
    borderWidth: 1.5,
  },
  dropdownValue: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontFamily: typography.fontFamily.regular,
    flex: 1,
  },
  dropdownValuePlaceholder: {
    color: colors.text.tertiary,
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
    maxHeight: 180,
    zIndex: 9999,
    elevation: 10,
    ...shadows.lg,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 220,
    backgroundColor: colors.background.primary,
  },
  dropdownItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    height: 44,
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light + '50',
    backgroundColor: colors.background.primary,
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
  },
  dropdownItemDefault: {
    backgroundColor: colors.gray[50],
  },
  dropdownItemTextDefault: {
    color: colors.text.secondary,
    fontWeight: '500',
  },
});