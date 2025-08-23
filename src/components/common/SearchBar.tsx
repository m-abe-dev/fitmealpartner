import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, typography, radius, spacing } from '../../design-system';

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onSubmit?: (text: string) => void;
  onClear?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showClearButton?: boolean;
  autoFocus?: boolean;
  style?: ViewStyle;
  inputStyle?: TextStyle;
  variant?: 'default' | 'rounded' | 'minimal';
}

export const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = '検索...',
  value = '',
  onChangeText,
  onFocus,
  onBlur,
  onSubmit,
  onClear,
  leftIcon,
  rightIcon,
  showClearButton = true,
  autoFocus = false,
  style,
  inputStyle,
  variant = 'default',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  const currentValue = value !== undefined ? value : internalValue;

  React.useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleChangeText = (text: string) => {
    if (onChangeText) {
      onChangeText(text);
    } else {
      setInternalValue(text);
    }
  };

  const handleClear = () => {
    handleChangeText('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleSubmit = () => {
    onSubmit?.(currentValue);
    inputRef.current?.blur();
  };

  const containerStyles = [
    styles.container,
    styles[variant],
    isFocused && styles.focused,
    style,
  ];

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border.light, colors.primary.main],
  });

  return (
    <Animated.View style={[containerStyles, { borderColor }]}>
      {/* Left Icon */}
      {leftIcon && (
        <View style={styles.leftIcon}>
          {leftIcon}
        </View>
      )}

      {/* Search Input */}
      <TextInput
        ref={inputRef}
        style={[styles.input, inputStyle]}
        placeholder={placeholder}
        placeholderTextColor={colors.text.tertiary}
        value={currentValue}
        onChangeText={handleChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onSubmitEditing={handleSubmit}
        autoFocus={autoFocus}
        returnKeyType="search"
        clearButtonMode="never" // We'll handle this manually
      />

      {/* Clear Button */}
      {showClearButton && currentValue.length > 0 && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClear}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.clearIcon}>
            <Text style={styles.clearText}>×</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Right Icon */}
      {rightIcon && !showClearButton && (
        <TouchableOpacity style={styles.rightIcon}>
          {rightIcon}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// Search Bar with Suggestions
interface SearchWithSuggestionsProps extends SearchBarProps {
  suggestions: string[];
  onSuggestionPress?: (suggestion: string) => void;
  maxSuggestions?: number;
  showSuggestions?: boolean;
}

export const SearchWithSuggestions: React.FC<SearchWithSuggestionsProps> = ({
  suggestions = [],
  onSuggestionPress,
  maxSuggestions = 5,
  showSuggestions = true,
  ...searchProps
}) => {
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);

  React.useEffect(() => {
    const currentValue = searchProps.value || '';
    if (currentValue.length > 0 && showSuggestions) {
      const filtered = suggestions
        .filter(suggestion =>
          suggestion.toLowerCase().includes(currentValue.toLowerCase())
        )
        .slice(0, maxSuggestions);
      setFilteredSuggestions(filtered);
      setShowSuggestionsList(filtered.length > 0);
    } else {
      setShowSuggestionsList(false);
    }
  }, [searchProps.value, suggestions, maxSuggestions, showSuggestions]);

  const handleSuggestionPress = (suggestion: string) => {
    onSuggestionPress?.(suggestion);
    setShowSuggestionsList(false);
  };

  const handleFocus = () => {
    searchProps.onFocus?.();
    if (filteredSuggestions.length > 0) {
      setShowSuggestionsList(true);
    }
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow tap on suggestion
    setTimeout(() => {
      setShowSuggestionsList(false);
      searchProps.onBlur?.();
    }, 150);
  };

  return (
    <View style={styles.suggestionsContainer}>
      <SearchBar
        {...searchProps}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      
      {showSuggestionsList && (
        <View style={styles.suggestionsList}>
          {filteredSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => handleSuggestionPress(suggestion)}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// Expandable Search Bar
interface ExpandableSearchBarProps extends Omit<SearchBarProps, 'style'> {
  isExpanded: boolean;
  onToggle: () => void;
  collapsedWidth?: number;
  expandedWidth?: number;
  animationDuration?: number;
  style?: ViewStyle;
}

export const ExpandableSearchBar: React.FC<ExpandableSearchBarProps> = ({
  isExpanded,
  onToggle,
  collapsedWidth = 40,
  expandedWidth = 250,
  animationDuration = 300,
  style,
  ...searchProps
}) => {
  const widthAnim = useRef(new Animated.Value(collapsedWidth)).current;

  React.useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: isExpanded ? expandedWidth : collapsedWidth,
      duration: animationDuration,
      useNativeDriver: false,
    }).start();
  }, [isExpanded, collapsedWidth, expandedWidth, animationDuration, widthAnim]);

  return (
    <Animated.View style={[styles.expandableContainer, { width: widthAnim }, style]}>
      {isExpanded ? (
        <SearchBar
          {...searchProps}
          autoFocus={true}
          onBlur={() => {
            searchProps.onBlur?.();
            onToggle();
          }}
        />
      ) : (
        <TouchableOpacity style={styles.collapsedButton} onPress={onToggle}>
          {searchProps.leftIcon}
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.sm,
    minHeight: 44,
  },
  default: {
    borderRadius: radius.md,
  },
  rounded: {
    borderRadius: radius.full,
  },
  minimal: {
    borderWidth: 0,
    backgroundColor: colors.background.secondary,
    borderRadius: radius.md,
  },
  focused: {
    borderColor: colors.primary.main,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    marginLeft: spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    paddingVertical: spacing.xs,
  },
  clearButton: {
    marginLeft: spacing.xs,
  },
  clearIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: {
    color: colors.text.inverse,
    fontSize: 16,
    lineHeight: 16,
  },
  
  // Suggestions Styles
  suggestionsContainer: {
    position: 'relative',
  },
  suggestionsList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderTopWidth: 0,
    maxHeight: 200,
    zIndex: 1000,
  },
  suggestionItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  suggestionText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
  },
  
  // Expandable Styles
  expandableContainer: {
    overflow: 'hidden',
  },
  collapsedButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});