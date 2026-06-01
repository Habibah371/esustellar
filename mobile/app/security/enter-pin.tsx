import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Button from '../../components/ui/Button';
import { PinPad } from '../../components/security/PinPad';
import { notifyAppUnlocked } from '../../services/security/appLock';
import { pinService } from '../../services/security/pinService';
import { PIN_LENGTH } from '../../services/security/pinPolicy';

function normalizeParam(value?: string | string[]): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

export default function EnterPinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    mode?: string | string[];
    reason?: string | string[];
    returnTo?: string | string[];
  }>();
  const mode = normalizeParam(params.mode);
  const reason = normalizeParam(params.reason);
  const returnTo = normalizeParam(params.returnTo);

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState(true);
  const [pinSet, setPinSet] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState(3);
  const [remainingLockoutMs, setRemainingLockoutMs] = useState(0);
  const [verifying, setVerifying] = useState(false);

  const helperText = useMemo(() => {
    if (remainingLockoutMs > 0) {
      return `Try again in ${Math.ceil(remainingLockoutMs / 1000)} seconds.`;
    }

    if (mode === 'change') {
      return 'Enter your current PIN to continue.';
    }

    if (reason === 'biometric-fallback') {
      return 'Biometric sign-in failed, so your PIN is being used as a fallback.';
    }

    if (reason === 'auto-lock') {
      return 'Enter your PIN to unlock the app.';
    }

    return `You have ${remainingAttempts} attempt${
      remainingAttempts === 1 ? '' : 's'
    } remaining.`;
  }, [mode, reason, remainingAttempts, remainingLockoutMs]);

  useEffect(() => {
    let active = true;

    void (async () => {
      const status = await pinService.getStatus();

      if (!active) {
        return;
      }

      setPinSet(status.isPinSet);
      setRemainingAttempts(status.remainingAttempts);
      setRemainingLockoutMs(status.remainingLockoutMs);
      setLoadingState(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (remainingLockoutMs <= 0) {
      return;
    }

    const interval = setInterval(() => {
      void (async () => {
        const status = await pinService.getStatus();
        setRemainingAttempts(status.remainingAttempts);
        setRemainingLockoutMs(status.remainingLockoutMs);

        if (status.remainingLockoutMs <= 0) {
          setError(null);
        }
      })();
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [remainingLockoutMs]);

  useEffect(() => {
    if (pin.length !== PIN_LENGTH || verifying || remainingLockoutMs > 0) {
      return;
    }

    let cancelled = false;

    void (async () => {
      setVerifying(true);
      const result = await pinService.verifyPin(pin);

      if (cancelled) {
        return;
      }

      setPin('');
      setVerifying(false);
      setRemainingAttempts(result.remainingAttempts);
      setRemainingLockoutMs(result.remainingLockoutMs);

      if (result.success) {
        setError(null);

        if (mode === 'change') {
          router.replace('/security/setup-pin?mode=change');
          return;
        }

        if (returnTo) {
          router.replace(returnTo);
          return;
        }

        if (reason === 'auto-lock' || reason === 'biometric-fallback') {
          notifyAppUnlocked();
        }

        router.back();
        return;
      }

      if (result.locked) {
        setError(
          `Too many failed attempts. PIN entry is locked for ${Math.ceil(
            result.remainingLockoutMs / 1000
          )} seconds.`
        );
        return;
      }

      setError(
        `Incorrect PIN. ${result.remainingAttempts} attempt${
          result.remainingAttempts === 1 ? '' : 's'
        } remaining.`
      );
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, pin, remainingLockoutMs, returnTo, router, verifying]);

  const handleDigit = (digit: string) => {
    if (pin.length < PIN_LENGTH) {
      setError(null);
      setPin((current) => `${current}${digit}`);
    }
  };

  const handleBackspace = () => {
    setError(null);
    setPin((current) => current.slice(0, -1));
  };

  if (loadingState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <Text style={styles.stateText}>Checking PIN status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pinSet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centeredState}>
          <Text style={styles.stateTitle}>No PIN available</Text>
          <Text style={styles.stateText}>
            Set up a fallback PIN before using this screen.
          </Text>
          <Button onPress={() => router.replace('/security/setup-pin')} style={styles.stateButton}>
            Set Up PIN
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <PinPad
          disabled={verifying || remainingLockoutMs > 0}
          error={error}
          helperText={helperText}
          title={mode === 'change' ? 'Verify current PIN' : 'Enter your PIN'}
          subtitle={
            mode === 'change'
              ? 'Confirm your existing PIN before choosing a new one.'
              : 'Use your fallback PIN to continue.'
          }
          valueLength={pin.length}
          onBackspace={handleBackspace}
          onDigit={handleDigit}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0F172A',
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centeredState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  stateTitle: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  stateText: {
    color: '#CBD5E1',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  stateButton: {
    marginTop: 20,
    minWidth: 180,
  },
});
