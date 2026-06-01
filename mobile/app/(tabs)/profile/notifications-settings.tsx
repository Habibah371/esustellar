import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';

const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Silent fail for demo purposes
    }
  },
};

const STORAGE_KEY = 'notification_settings';

interface NotificationSettings {
  contributionReminders: boolean;
  payoutReceived: boolean;
  newMemberJoined: boolean;
  groupStatusChanges: boolean;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  contributionReminders: true,
  payoutReceived: true,
  newMemberJoined: false,
  groupStatusChanges: true,
};

export default function NotificationSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const [settings, setSettings] =
    useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await storage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedSettings = JSON.parse(stored);
        setSettings({ ...DEFAULT_SETTINGS, ...parsedSettings });
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await storage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
      setSettings(newSettings);
    } catch (error) {
      console.error('Failed to save notification settings:', error);
    }
  };

  const updateSetting = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    void saveSettings(newSettings);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>
            {t('notificationSettings.loading')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← {t('common.back')}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('notificationSettings.title')}</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <Text style={styles.description}>
            {t('notificationSettings.description')}
          </Text>

          <View style={styles.settingsList}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>
                  {t('notificationSettings.contributionRemindersTitle')}
                </Text>
                <Text style={styles.settingDescription}>
                  {t('notificationSettings.contributionRemindersDescription')}
                </Text>
              </View>
              <Switch
                value={settings.contributionReminders}
                onValueChange={(value: boolean) =>
                  updateSetting('contributionReminders', value)
                }
                trackColor={{ false: '#767577', true: '#4CAF50' }}
                thumbColor={
                  settings.contributionReminders ? '#ffffff' : '#f4f3f4'
                }
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>
                  {t('notificationSettings.payoutReceivedTitle')}
                </Text>
                <Text style={styles.settingDescription}>
                  {t('notificationSettings.payoutReceivedDescription')}
                </Text>
              </View>
              <Switch
                value={settings.payoutReceived}
                onValueChange={(value: boolean) =>
                  updateSetting('payoutReceived', value)
                }
                trackColor={{ false: '#767577', true: '#4CAF50' }}
                thumbColor={settings.payoutReceived ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>
                  {t('notificationSettings.newMemberJoinedTitle')}
                </Text>
                <Text style={styles.settingDescription}>
                  {t('notificationSettings.newMemberJoinedDescription')}
                </Text>
              </View>
              <Switch
                value={settings.newMemberJoined}
                onValueChange={(value: boolean) =>
                  updateSetting('newMemberJoined', value)
                }
                trackColor={{ false: '#767577', true: '#4CAF50' }}
                thumbColor={settings.newMemberJoined ? '#ffffff' : '#f4f3f4'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>
                  {t('notificationSettings.groupStatusChangesTitle')}
                </Text>
                <Text style={styles.settingDescription}>
                  {t('notificationSettings.groupStatusChangesDescription')}
                </Text>
              </View>
              <Switch
                value={settings.groupStatusChanges}
                onValueChange={(value: boolean) =>
                  updateSetting('groupStatusChanges', value)
                }
                trackColor={{ false: '#767577', true: '#4CAF50' }}
                thumbColor={settings.groupStatusChanges ? '#ffffff' : '#f4f3f4'}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  description: {
    color: '#94A3B8',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  settingsList: {
    gap: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  settingInfo: {
    flex: 1,
    marginEnd: 16,
  },
  settingTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  settingDescription: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
});
