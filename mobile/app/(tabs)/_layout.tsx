import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useNotificationsStore } from '../../stores/notificationsStore';

export default function TabsLayout() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const unreadCount = useNotificationsStore((s) => s.unreadCount);

  // Badge: cap at 9+, hide when zero.
  const badgeValue = unreadCount > 9 ? '9+' : unreadCount > 0 ? unreadCount : undefined;

  /**
   * Memoize the screenOptions object so its reference is stable across
   * re-renders.  A new object every render forces Tabs to re-evaluate all
   * child screen options, which is measurable jank on mid-range Android.
   */
  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      // Keeps off-screen tabs frozen (no JS renders) — critical for perf on
      // Android where inactive tabs can still receive layout events.
      freezeOnBlur: true,
      tabBarStyle: {
        backgroundColor: colors.card,
        borderTopWidth: 0,
        // iOS: remove the default translucent blur overlay — our solid
        // card colour looks cleaner and avoids a compositor layer.
        ...(Platform.OS === 'ios' && { position: 'absolute' as const }),
        // Android: match Material 3 height for consistent touch targets.
        ...(Platform.OS === 'android' && { height: 60 }),
      },
      tabBarActiveTintColor: colors.accent,
      tabBarInactiveTintColor: colors.subtext,
      // iOS: system font scaling — respects user accessibility settings.
      tabBarLabelStyle: Platform.OS === 'ios'
        ? { fontSize: 11, fontWeight: '500' as const }
        : { fontSize: 12 },
    }),
    [colors.card, colors.accent, colors.subtext],
  );

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="groups"
        options={{
          title: t('tabs.groups'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: t('tabs.notifications'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="notifications-outline" size={22} color={color} />
          ),
          tabBarBadge: badgeValue,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t('tabs.profile'),
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
