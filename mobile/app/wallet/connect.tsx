import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Button from '../../components/ui/Button';

export default function WalletConnectScreen() {
  const router = useRouter();

  const handleAddWallet = () => {
    router.push('/wallet/add');
  };

  const handleComingSoon = (walletName: string) => {
    Alert.alert(
      'Coming soon',
      `${walletName} support is coming soon. For now, add a wallet manually.`,
    );
  };

  const handleHelpLink = () => {
    Linking.openURL('https://developers.stellar.org/docs/wallets');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>🌍✨</Text>
        <Text style={styles.appName}>EsuStellar</Text>
        <Text style={styles.headline}>Connect your Stellar Wallet</Text>
        <Text style={styles.subMessage}>
          Your wallet is used to sign contributions and payouts on-chain.
        </Text>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.walletButton}
            onPress={() => handleComingSoon('Freighter')}
          >
            <Text style={styles.walletButtonText}>Connect Freighter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.walletButton, styles.walletButtonSecondary]}
            onPress={() => handleComingSoon('Lobstr')}
          >
            <Text style={[styles.walletButtonText, styles.walletButtonTextSecondary]}>
              Connect Lobstr
            </Text>
          </TouchableOpacity>
        </View>

        <Button onPress={handleAddWallet}>Add wallet manually</Button>

        <TouchableOpacity onPress={handleHelpLink}>
          <Text style={styles.helpLink}>What is a Stellar wallet?</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  logo: {
    fontSize: 48,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#6C63FF',
  },
  headline: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A2E',
    textAlign: 'center',
    marginTop: 8,
  },
  subMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  buttons: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  walletButton: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  walletButtonSecondary: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#6C63FF',
  },
  walletButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  walletButtonTextSecondary: {
    color: '#6C63FF',
  },
  helpLink: {
    color: '#6C63FF',
    fontSize: 14,
    textDecorationLine: 'underline',
    marginTop: 8,
  },
});
