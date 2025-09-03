import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { colors, typography, spacing, radius } from '../../design-system';
import { SimpleCalendar } from './SimpleCalendar';

interface CalendarModalProps {
  isVisible: boolean;
  onClose: () => void;
  selectedDate?: string;
  onDateSelect: (dateString: string) => void;
  title: string;
  minDate?: string;
  maxDate?: string;
  showYearSelector?: boolean;
}

export const CalendarModal: React.FC<CalendarModalProps> = ({
  isVisible,
  onClose,
  selectedDate,
  onDateSelect,
  title,
  minDate,
  maxDate,
  showYearSelector = false,
}) => {
  const handleDateSelect = (dateString: string) => {
    onDateSelect(dateString);
    onClose();
  };

  return (
    <Modal
      transparent={true}
      animationType="slide"
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.calendarOverlay}>
        <View style={styles.calendarContainer}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.calendarHeaderButton}
            >
              <Text style={styles.calendarCancel}>キャンセル</Text>
            </TouchableOpacity>
            <View style={styles.calendarTitleContainer}>
              <Text style={styles.calendarTitle}>{title}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.calendarHeaderButton}
            >
              <Text style={styles.calendarDone}>完了</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarContent}>
            <SimpleCalendar
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              minDate={minDate}
              maxDate={maxDate}
              showYearSelector={showYearSelector}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
    textAlign: 'center',
  },
  calendarDone: {
    fontSize: typography.fontSize.base,
    color: colors.primary.main,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
  },
  calendarContent: {
    padding: spacing.lg,
  },
});