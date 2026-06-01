import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface NotificationBannerProps {
  body?: string;
  title: string;
  visible: boolean;
  onDismiss: () => void;
  onPress: () => void;
}

export function NotificationBanner({
  body,
  title,
  visible,
  onDismiss,
  onPress,
}: NotificationBannerProps) {
  if (!visible) {
    return null;
  }

  return (
    <View pointerEvents="box-none" style={styles.wrapper}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={styles.banner}
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
          hitSlop={8}
          onPress={(event) => {
            event.stopPropagation();
            onDismiss();
          }}
          style={styles.closeButton}
        >
          <Text style={styles.closeText}>x</Text>
        </Pressable>
      </Pressable>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
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
  closeText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
