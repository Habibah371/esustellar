import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface NotificationBannerProps {
  body?: string;
  title: string;
  visible: boolean;
  onDismiss: () => void;
  onPress: () => void;
}

// ─── Animation constants ──────────────────────────────────────────────────────
// iOS: spring feels native and natural for overlay elements.
// Android: timing with ease-out matches Material motion guidelines
// (200 ms enter, 150 ms exit).

const ENTER_DURATION_ANDROID = 200;
const EXIT_DURATION_ANDROID = 150;

const TRANSLATE_Y_HIDDEN = -80; // slide up out of view
const TRANSLATE_Y_VISIBLE = 0;

// ─── Component ────────────────────────────────────────────────────────────────

export function NotificationBanner({
  body,
  title,
  visible,
  onDismiss,
  onPress,
}: NotificationBannerProps) {
  // Keep the node mounted while animating out so the exit animation plays.
  const mountedRef = useRef(false);
  const translateY = useRef(new Animated.Value(TRANSLATE_Y_HIDDEN)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      mountedRef.current = true;

      if (Platform.OS === 'ios') {
        // Spring enter on iOS — feels like a native alert card.
        Animated.parallel([
          Animated.spring(translateY, {
            toValue: TRANSLATE_Y_VISIBLE,
            useNativeDriver: true,
            bounciness: 6,
            speed: 14,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Linear ease-out enter on Android — avoids spring overshoot on
        // lower-end devices and matches Material motion.
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: TRANSLATE_Y_VISIBLE,
            duration: ENTER_DURATION_ANDROID,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: ENTER_DURATION_ANDROID,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      // Exit: same timing on both platforms, slightly faster.
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: TRANSLATE_Y_HIDDEN,
          duration: EXIT_DURATION_ANDROID,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: EXIT_DURATION_ANDROID,
          useNativeDriver: true,
        }),
      ]).start(() => {
        mountedRef.current = false;
      });
    }
  }, [visible, translateY, opacity]);

  // Don't render at all if we've never been shown.
  if (!visible && !mountedRef.current) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <Animated.View style={{ transform: [{ translateY }], opacity }}>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          // Slightly scales down on press — native-feeling feedback on both
          // platforms without needing expo-haptics here.
          style={({ pressed }) => [
            styles.banner,
            pressed && styles.bannerPressed,
          ]}
        >
          <View style={styles.content}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            {body ? (
              <Text numberOfLines={2} style={styles.body}>
                {body}
              </Text>
            ) : null}
          </View>

          <Pressable
            accessibilityLabel="Dismiss notification banner"
            accessibilityRole="button"
            hitSlop={12}
            onPress={(event) => {
              event.stopPropagation();
              onDismiss();
            }}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
          >
            <Text style={styles.closeText}>✕</Text>
          </Pressable>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    position: 'absolute',
    start: 0,
    end: 0,
    top: 56,
    zIndex: 100,
  },
  banner: {
    alignItems: 'center',
    backgroundColor: '#111827',
    borderColor: '#1F2937',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    // Elevation for Android (mirrors the iOS shadow visually)
    elevation: 8,
  },
  bannerPressed: {
    opacity: 0.85,
  },
  content: {
    flex: 1,
    paddingEnd: 12,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  body: {
    color: '#D1D5DB',
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    alignItems: 'center',
    borderColor: '#374151',
    borderRadius: 999,
    borderWidth: 1,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  closeButtonPressed: {
    backgroundColor: '#374151',
  },
  closeText: {
    color: '#F9FAFB',
    fontSize: 12,
    fontWeight: '700',
  },
});
