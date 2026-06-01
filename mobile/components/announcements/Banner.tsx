import React, { useCallback, useEffect, useMemo } from 'react';
import { AppState, AppStateStatus, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchAnnouncements } from '../../services/announcements';
import { useAnnouncementsStore } from '../../stores/announcementsStore';

const REFRESH_INTERVAL_MS = 30000;

const VARIANT_STYLES = {
  info: {
    backgroundColor: '#EAF2FF',
    borderColor: '#93C5FD',
    iconColor: '#2563EB',
    titleColor: '#0F172A',
    messageColor: '#334155',
  },
  warning: {
    backgroundColor: '#FFF7E6',
    borderColor: '#FCD34D',
    iconColor: '#D97706',
    titleColor: '#111827',
    messageColor: '#4B5563',
  },
  success: {
    backgroundColor: '#ECFDF3',
    borderColor: '#86EFAC',
    iconColor: '#16A34A',
    titleColor: '#052E16',
    messageColor: '#166534',
  },
} as const;

function AnnouncementIcon({ type }: { type: keyof typeof VARIANT_STYLES }) {
  const name = type === 'warning' ? 'megaphone-outline' : type === 'success' ? 'sparkles-outline' : 'information-circle-outline';
  return <Ionicons name={name} size={18} color={VARIANT_STYLES[type].iconColor} />;
}

export function Banner() {
  const announcements = useAnnouncementsStore((state) => state.announcements);
  const dismissed = useAnnouncementsStore((state) => state.dismissed);
  const setAnnouncements = useAnnouncementsStore((state) => state.setAnnouncements);
  const dismiss = useAnnouncementsStore((state) => state.dismiss);

  const syncAnnouncements = useCallback(async () => {
    const items = await fetchAnnouncements();
    setAnnouncements(items);
  }, [setAnnouncements]);

  useEffect(() => {
    void syncAnnouncements();

    const interval = setInterval(() => {
      void syncAnnouncements();
    }, REFRESH_INTERVAL_MS);

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void syncAnnouncements();
      }
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [syncAnnouncements]);

  const announcement = useMemo(
    () => announcements.filter((item) => !dismissed.includes(item.id))[0],
    [announcements, dismissed],
  );

  const variant = useMemo(() => {
    if (!announcement) return VARIANT_STYLES.info;
    return VARIANT_STYLES[announcement.type];
  }, [announcement]);

  if (!announcement) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: variant.backgroundColor,
          borderColor: variant.borderColor,
        },
      ]}
    >
      <View style={styles.iconWrap}>
        <AnnouncementIcon type={announcement.type} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.title, { color: variant.titleColor }]} numberOfLines={1}>
          {announcement.title}
        </Text>
        <Text style={[styles.message, { color: variant.messageColor }]} numberOfLines={2}>
          {announcement.message}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Dismiss announcement: ${announcement.title}`}
        onPress={() => dismiss(announcement.id)}
        hitSlop={10}
        style={({ pressed }) => [styles.dismissButton, pressed && styles.dismissButtonPressed]}
      >
        <Ionicons name="close" size={18} color={variant.iconColor} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
    marginRight: 10,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  dismissButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  dismissButtonPressed: {
    opacity: 0.7,
  },
});