import React, { useState, useMemo } from 'react';
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Button from '../../components/ui/Button';
import { useTheme } from '../../context/ThemeContext';
import { useInvalidateNotifications } from '../../hooks/useNotifications';
import { useRefresh } from '../../hooks/useRefresh';
import { scheduleLocalNotification } from '../../services/notifications/notificationService';
import { logger } from '../../services/logger';

export default function NotificationsScreen() {
  const [scheduling, setScheduling] = useState(false);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const invalidateNotifications = useInvalidateNotifications();

  const fetchData = useMemo(
    () => async () => {
      logger.info('NotificationsScreen', 'Refreshing notifications');
      await invalidateNotifications();
    },
    [invalidateNotifications],
  );

  const { refreshing, onRefresh } = useRefresh(fetchData);

  const scheduleGroupNotification = async () => {
    setScheduling(true);
    logger.info('NotificationsScreen', 'Scheduling group notification');
    try {
      await scheduleLocalNotification({
        body: t('notifications.contributionDueBody'),
        data: { params: { groupId: '1' }, screen: 'groups/detail' },
        seconds: 2,
        title: t('notifications.contributionDueTitle'),
      });
      Alert.alert(
        t('notifications.scheduledTitle'),
        t('notifications.scheduledBody'),
      );
    } catch (err) {
      logger.error(
        'NotificationsScreen',
        'Failed to schedule notification',
        err,
      );
      Alert.alert(
        t('notifications.unableToScheduleTitle'),
        t('notifications.unableToScheduleBody'),
      );
    } finally {
      setScheduling(false);
    }
  };

  const scheduleUnknownRouteNotification = async () => {
    setScheduling(true);
    logger.info('NotificationsScreen', 'Scheduling fallback notification');
    try {
      await scheduleLocalNotification({
        body: t('notifications.unknownDestinationBody'),
        data: { screen: 'unsupported-screen' },
        seconds: 2,
        title: t('notifications.unknownDestinationTitle'),
      });
      Alert.alert(
        t('notifications.fallbackScheduledTitle'),
        t('notifications.fallbackScheduledBody'),
      );
    } catch (err) {
      logger.error(
        'NotificationsScreen',
        'Failed to schedule fallback notification',
        err,
      );
      Alert.alert(
        t('notifications.unableToScheduleTitle'),
        t('notifications.unableToScheduleBody'),
      );
    } finally {
      setScheduling(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
      >
        <Text style={[styles.title, { color: colors.text }]}>
          {t('notifications.title')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>
          {t('notifications.subtitle')}
        </Text>
        <Button
          disabled={scheduling}
          onPress={scheduleGroupNotification}
          style={styles.button}
        >
          {t('notifications.scheduleGroupDetail')}
        </Button>
        <Button
          disabled={scheduling}
          onPress={scheduleUnknownRouteNotification}
          style={styles.button}
          variant="outline"
        >
          {t('notifications.scheduleFallback')}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: '800', marginBottom: 12 },
  subtitle: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  button: { marginBottom: 12 },
});
