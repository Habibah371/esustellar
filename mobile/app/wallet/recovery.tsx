import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { useAuthStore } from '../../store/authStore';
import { addWallet, setActiveWallet } from '../../services/wallet/multiWallet';
import { recoverPublicKeyFromInput } from '../../services/wallet/recovery';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';

export default function WalletRecoveryScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const setWallet = useAuthStore((state) => state.setWallet);

  const [recoveryInput, setRecoveryInput] = useState('');
  const [label, setLabel] = useState('Recovered wallet');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const hasInput = recoveryInput.trim().length > 0;

  const handleRecover = async () => {
    setErrorMessage(null);
    setLoading(true);

    try {
      const { publicKey } = await recoverPublicKeyFromInput(recoveryInput);
      const walletLabel = label.trim().length > 0 ? label.trim() : 'Recovered wallet';
      const wallet = await addWallet(walletLabel, publicKey);
      await setActiveWallet(wallet.id);
      setWallet({ publicKey: wallet.publicKey, walletType: 'multiWallet' });

      Alert.alert(
        'Wallet restored',
        'Your wallet has been restored successfully. You can now use your account again.',
      );
      router.replace('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to recover wallet.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <KeyboardAvoidingView
        style={styles.wrapper}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { backgroundColor: colors.background }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: colors.text }]}>Recover Wallet</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>Enter your recovery phrase, secret seed, or Stellar public key to restore access.</Text>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.cardTitle, { color: colors.text }]}>What this does</Text>
            <Text style={[styles.body, { color: colors.subtext }]}>This app stores only your Stellar public account address. Your recovery phrase or secret seed is used locally to restore your public key and is not persisted.</Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.cardTitle, { color: colors.text }]}>Recovery input</Text>
            <TextInput
              value={recoveryInput}
              onChangeText={setRecoveryInput}
              placeholder="Enter recovery phrase or secret key"
              placeholderTextColor={colors.subtext}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            />
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Wallet label"
              placeholderTextColor={colors.subtext}
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.background }]}
            />
            {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
            <Button onPress={handleRecover} loading={loading} disabled={!hasInput || loading}>
              Restore wallet
            </Button>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}> 
            <Text style={[styles.cardTitle, { color: colors.text }]}>Tips for recovery</Text>
            <Text style={[styles.bullet, { color: colors.subtext }]}>• Use the exact phrase order with single spaces.</Text>
            <Text style={[styles.bullet, { color: colors.subtext }]}>• Secret seeds begin with an "S" and are 56 characters long.</Text>
            <Text style={[styles.bullet, { color: colors.subtext }]}>• If you only have your public key, you can paste it directly.</Text>
          </View>

          <Text style={[styles.note, { color: colors.subtext }]}>If you have already completed onboarding, this recovery path will restore wallet access immediately.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  wrapper: { flex: 1 },
  content: { padding: 20, gap: 18, paddingBottom: 30 },
  title: { fontSize: 26, fontWeight: '800' },
  subtitle: { fontSize: 15, lineHeight: 22 },
  card: { borderRadius: 16, padding: 16, gap: 12, borderWidth: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14, lineHeight: 22 },
  bullet: { fontSize: 14, lineHeight: 22 },
  input: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    minHeight: 48,
  },
  note: { fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 4 },
  error: { color: '#F87171', fontSize: 13, lineHeight: 18 },
});
