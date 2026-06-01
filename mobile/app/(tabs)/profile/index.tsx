import React, { useMemo, useState } from 'react';
import {
  I18nManager,
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Avatar } from '../../../components/ui/Avatar';
import Button from '../../../components/ui/Button';
import { DisconnectModal } from '../../../components/wallet/DisconnectModal';
import { useAuthStore } from '../../../store/authStore';
import { useTheme } from '../../../context/ThemeContext';
import { clearActiveWallet } from '../../../services/wallet/multiWallet';

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const ProfileScreen = React.memo(() => {
  const router = useRouter();
  const { t } = useTranslation();
  const wallet = useAuthStore((state) => state.wallet);
  const logout = useAuthStore((state) => state.logout);
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
  const { colors } = useTheme();

  const displayName = t('home.defaultUser');
  const walletAddress = wallet?.publicKey || 'GABCD1234EFGH5678IJKL9012MNOP';
  const truncatedAddress = useMemo(
    () => truncateAddress(walletAddress),
    [walletAddress],
  );

  const handleDisconnect = async () => {
    await clearActiveWallet();
    logout();
    setDisconnectModalVisible(false);
    router.replace('/wallet/connect');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar name={displayName} size="lg" />
          <Text style={[styles.displayName, { color: colors.text }]}>{displayName}</Text>
          <Text style={[styles.walletAddress, { color: colors.subtext }]}>{truncatedAddress}</Text>
        </View>

        <View style={styles.section}>
          <Button
            variant="outline"
            size="lg"
            onPress={() => router.push('/profile/edit')}
          >
            {t('profile.editProfile')}
          </Button>
        </View>

        <View style={styles.section}>
          <Pressable
            style={[styles.settingsRow, { backgroundColor: colors.card }]}
            onPress={() => router.push('/profile/settings')}
            accessibilityRole="button"
          >
            <Text style={[styles.settingsLabel, { color: colors.text }]}>
              {t('profile.settings')}
            </Text>
            <Text style={[styles.chevron, { color: colors.subtext }]}>
              {I18nManager.isRTL ? '‹' : '›'}
            </Text>
          </Pressable>

          <View style={[styles.separator, { backgroundColor: colors.border }]} />

          <Pressable
            style={[styles.settingsRow, { backgroundColor: colors.card }]}
            onPress={() => setDisconnectModalVisible(true)}
            accessibilityRole="button"
          >
            <Text style={[styles.settingsLabel, { color: '#EF4444' }]}>
              {t('profile.disconnectWallet')}
            </Text>
            <Text style={[styles.chevron, { color: '#EF4444' }]}>
              {I18nManager.isRTL ? '‹' : '›'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <DisconnectModal
        visible={disconnectModalVisible}
        onConfirm={handleDisconnect}
        onCancel={() => setDisconnectModalVisible(false)}
      />
    </SafeAreaView>
  );
});

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 32,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  displayName: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 15,
  },
  section: {
    width: '100%',
    marginBottom: 16,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderRadius: 12,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 24,
    lineHeight: 24,
  },
  separator: {
    height: 1,
    marginVertical: 4,
  },
  spacer: {
    height: 20,
  },
});