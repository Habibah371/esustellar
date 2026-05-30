import React, { useCallback, useMemo } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { triggerHapticFeedback } from '../../utils/haptics';
import { useTheme } from '../../context/ThemeContext';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  variant?: Variant;
  size?: Size;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  destructive?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}

const padding: Record<Size, ViewStyle> = {
  sm: { paddingVertical: 6, paddingHorizontal: 12 },
  md: { paddingVertical: 10, paddingHorizontal: 20 },
  lg: { paddingVertical: 14, paddingHorizontal: 28 },
};

const fontSize: Record<Size, number> = { sm: 13, md: 15, lg: 17 };

const Button = React.memo<ButtonProps>(
  ({
    variant = 'primary',
    size = 'md',
    onPress,
    disabled,
    loading,
    destructive,
    style,
    children,
  }) => {
    const { colors, resolvedColorScheme } = useTheme();
    const isDisabled = disabled || loading;
    const secondaryBg = resolvedColorScheme === 'dark' ? '#1F2937' : '#1E293B';
    const onAccentText = resolvedColorScheme === 'dark' ? '#0B1220' : '#FFFFFF';

    const bg: Record<Variant, string> = {
      primary: colors.accent,
      secondary: secondaryBg,
      outline: 'transparent',
      ghost: 'transparent',
    };

    const border: Record<Variant, string> = {
      primary: colors.accent,
      secondary: secondaryBg,
      outline: colors.accent,
      ghost: 'transparent',
    };

    const textColor: Record<Variant, string> = {
      primary: onAccentText,
      secondary: '#FFFFFF',
      outline: colors.accent,
      ghost: colors.accent,
    };

    const handlePress = useCallback(() => {
      if (!isDisabled && onPress) {
        if (destructive) {
          triggerHapticFeedback.heavy();
        } else {
          triggerHapticFeedback.light();
        }
        onPress();
      }
    }, [isDisabled, onPress, destructive]);

    const buttonStyle = useMemo(
      () => [
        styles.base,
        padding[size],
        {
          backgroundColor: bg[variant],
          borderColor: border[variant],
          opacity: isDisabled ? 0.5 : 1,
        },
        style,
      ],
      [size, variant, isDisabled, style, bg, border],
    );

    const textStyle = useMemo(
      () => ({
        color: textColor[variant],
        fontSize: fontSize[size],
        fontWeight: '600' as const,
      }),
      [variant, size, textColor],
    );

    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        style={buttonStyle}
        activeOpacity={0.8}
      >
        {loading ? (
          <ActivityIndicator color={textColor[variant]} size="small" />
        ) : (
          <Text style={textStyle}>{children}</Text>
        )}
      </TouchableOpacity>
    );
  },
);

Button.displayName = 'Button';

export default Button;

const styles = StyleSheet.create({
  base: {
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
