import React, { useState, useMemo } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar } from '../../../components/ui/Avatar';
import { Button } from '../../../components/ui/Button';
import { DisconnectModal } from '../../../components/wallet/DisconnectModal';
import { useAuthStore } from '../../../store/authStore';
import { useTheme } from '../../../context/ThemeContext';

// Truncate wallet address
function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

const ProfileScreen = React.memo(() => {
  const router = useRouter();
  const wallet = useAuthStore((s) => s.wallet);
  const logout = useAuthStore((s) => s.logout);
  const [disconnectModalVisible, setDisconnectModalVisible] = useState(false);
  const { colors } = useTheme();

  const displayName = 'EsuStellar User';
  const walletAddress = wallet?.publicKey || 'GABCD1234EFGH5678IJKL9012MNOP';
  const truncatedAddress = useMemo(() => truncateAddress(walletAddress), [walletAddress]);

  const handleDisconnect = () => {
    logout();
    setDisconnectModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header: Avatar, Name, Address */}
        <View style={styles.header}>
          <Avatar name={displayName} size="lg" />
          <Text style={styles.displayName}>{displayName}</Text>
          <Text style={styles.walletAddress}>{truncatedAddress}</Text>
        </View>

        {/* Action Button */}
        <View style={styles.section}>
          <Button variant="outline" size="lg" onPress={() => router.push('/profile/edit')}>
            Edit Profile
          </Button>
        </View>

        {/* Settings Rows */}
        <View style={styles.section}>
          <Pressable
            style={styles.settingsRow}
            onPress={() => router.push('/profile/settings')}
            accessibilityRole="button"
          >
            <Text style={styles.settingsLabel}>Settings</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.separator} />

          <Pressable
            style={styles.settingsRow}
            onPress={() => setDisconnectModalVisible(true)}
            accessibilityRole="button"
          >
            <Text style={[styles.settingsLabel, { color: '#EF4444' }]}>
              Disconnect Wallet
            </Text>
            <Text style={[styles.chevron, { color: '#EF4444' }]}>›</Text>
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
    backgroundColor: colors.background,
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
    color: colors.text,
    marginTop: 16,
    marginBottom: 4,
  },
  walletAddress: {
    fontSize: 15,
    color: colors.subtext,
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
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  settingsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  chevron: {
    fontSize: 24,
    color: colors.subtext,
    lineHeight: 24,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 4,
  },
  spacer: {
    height: 20,
  },
});