import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/ui/Button';
import { useAuthStore } from '../../store/authStore';
import { addWallet, getActiveWallet } from '../../services/wallet/multiWallet';

const PUBLIC_KEY_REGEX = /^G[A-Z2-7]{55}$/;

export default function AddWalletScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const setWallet = useAuthStore((state) => state.setWallet);

  const [label, setLabel] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isValid = useMemo(
    () => label.trim().length > 0 && PUBLIC_KEY_REGEX.test(publicKey.trim()),
    [label, publicKey],
  );

  const handleCreateWallet = async () => {
    if (!label.trim()) {
      setMessage('Enter a wallet label.');
      return;
    }

    const trimmedKey = publicKey.trim();
    if (!PUBLIC_KEY_REGEX.test(trimmedKey)) {
      setMessage('Enter a valid Stellar public key.');
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      await addWallet(label.trim(), trimmedKey);
      const active = await getActiveWallet();
      if (active) {
        setWallet({ publicKey: active.publicKey, walletType: 'multiWallet' });
      }
      router.replace('/');
    } catch (error) {
      setMessage('Unable to add wallet.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}> 
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>Add Wallet</Text>
        <Text style={[styles.subtitle, { color: colors.subtext }]}>Import a wallet using your Stellar public key.</Text>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Wallet label</Text>
          <TextInput
            value={label}
            onChangeText={setLabel}
            placeholder="My savings wallet"
            placeholderTextColor={colors.subtext}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text }]}>Public key</Text>
          <TextInput
            value={publicKey}
            onChangeText={setPublicKey}
            placeholder="G..."
            autoCapitalize="characters"
            autoCorrect={false}
            placeholderTextColor={colors.subtext}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
          />
        </View>

        <Button onPress={handleCreateWallet} loading={saving} disabled={!isValid || saving}>
          Add wallet
        </Button>

        {message ? <Text style={[styles.message, { color: colors.text }]}>{message}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  message: {
    marginTop: 12,
    fontSize: 14,
  },
});
