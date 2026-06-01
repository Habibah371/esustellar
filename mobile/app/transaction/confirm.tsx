import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
  Animated,
  Linking,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Stack } from "expo-router";
import Button from "../../components/ui/Button";
import { triggerHapticFeedback } from "../../utils/haptics";
import { txExplorerLink } from "../../utils/explorerLink";

// ── Types ───────────────────────────────────────────────────────────────────

type TxType = "contribution" | "payout" | "fee";

const TYPE_LABEL: Record<TxType, { label: string; icon: string }> = {
  contribution: { label: "Contribution", icon: "💰" },
  payout: { label: "Payout", icon: "💸" },
  fee: { label: "Fee", icon: "⚡" },
};

const LARGE_AMOUNT_THRESHOLD = 1000; // XLM

// ── Helpers ─────────────────────────────────────────────────────────────────

function truncate(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function isHighValue(amount: number): boolean {
  return amount > LARGE_AMOUNT_THRESHOLD;
}

// ── Screen ──────────────────────────────────────────────────────────────────

export default function TransactionConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    amount?: string;
    destination?: string;
    fee?: string;
    memo?: string;
    groupName?: string;
  }>();

  const type = (params.type ?? "contribution") as TxType;
  const amount = params.amount ?? "0";
  const destination = params.destination ?? "";
  const fee = params.fee ?? "0.00001";
  const memo = params.memo ?? "";
  const groupName = params.groupName ?? "";

  const numericAmount = Number.parseFloat(amount);
  const numericFee = Number.parseFloat(fee);
  const totalDeduction = Number.isFinite(numericAmount) && Number.isFinite(numericFee)
    ? numericAmount + numericFee
    : null;

  const isHighFee = Number.isFinite(numericFee) && numericFee > 0.01;
  const isLargeAmount = Number.isFinite(numericAmount) && isHighValue(numericAmount);
  const hasRisks = isHighFee || isLargeAmount || !destination;

  // ── State ──────────────────────────────────────────────────────

  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [signed, setSigned] = useState(false);
  const [txHash, setTxHash] = useState("");

  // ── Animations ─────────────────────────────────────────────────

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateConfirm = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  // ── Handlers ───────────────────────────────────────────────────

  const handleConfirm = async () => {
    triggerHapticFeedback.success();
    animateConfirm();
    setSubmitting(true);

    // Simulate transaction submission
    await new Promise((r) => setTimeout(r, 1500));

    const hash = "mock_tx_hash_" + Date.now();
    setTxHash(hash);
    setSigned(true);
    setSubmitting(false);
    triggerHapticFeedback.success();
  };

  const handleCancel = () => {
    triggerHapticFeedback.warning();
    router.back();
  };

  const handleViewExplorer = () => {
    if (txHash) {
      Linking.openURL(txExplorerLink(txHash, "testnet"));
    }
  };

  const handleDone = () => {
    router.replace("/(tabs)");
  };

  // ── Risk notes ─────────────────────────────────────────────────

  const riskNotes = useMemo(() => {
    const notes: { message: string; severity: "warning" | "info" | "critical" }[] = [];

    if (!destination) {
      notes.push({
        message: "No destination account set. Cancel if unintentional.",
        severity: "critical",
      });
    }

    if (isLargeAmount) {
      notes.push({
        message: `Large amount (${amount} XLM). Double-check the recipient.`,
        severity: "warning",
      });
    }

    if (isHighFee) {
      notes.push({
        message: "Network fee is higher than usual. Verify before signing.",
        severity: "warning",
      });
    }

    notes.push({
      message: "Blockchain payments are irreversible. Verify every detail.",
      severity: "info",
    });

    return notes;
  }, [destination, isLargeAmount, isHighFee, amount]);

  // ── Total summary ──────────────────────────────────────────────

  const summaryItems = useMemo(() => {
    const items: { label: string; value: string; highlight?: boolean; warn?: boolean }[] = [
      { label: "Type", value: `${TYPE_LABEL[type]?.icon ?? ""} ${TYPE_LABEL[type]?.label ?? type}` },
    ];

    if (groupName) {
      items.push({ label: "Group", value: groupName });
    }

    items.push({ label: "You are sending", value: `${amount} XLM`, highlight: true });

    if (destination) {
      items.push({ label: "To", value: truncate(destination), mono: true });
    }

    items.push({ label: "Network Fee", value: `${fee} XLM`, warn: isHighFee });

    if (totalDeduction !== null) {
      items.push({ label: "Total Deduction", value: `${totalDeduction.toFixed(7)} XLM` });
    }

    if (memo) {
      items.push({ label: "Memo", value: memo });
    }

    return items;
  }, [type, groupName, amount, destination, fee, isHighFee, totalDeduction, memo]);

  // ── Signed state ───────────────────────────────────────────────

  if (signed && txHash) {
    return (
      <>
        <Stack.Screen options={{ gestureEnabled: false, headerShown: false }} />

        <SafeAreaView style={styles.container}>
          <View style={styles.signedContainer}>
            {/* Success indicator */}
            <View style={styles.successIconWrap}>
              <View style={styles.successIconCircle}>
                <Text style={styles.successCheckmark}>✓</Text>
              </View>
            </View>

            <Text style={styles.signedTitle}>Transaction Signed!</Text>
            <Text style={styles.signedSubtitle}>
              Your transaction has been submitted to the Stellar network.
            </Text>

            {/* Transaction hash card */}
            <View style={styles.hashCard}>
              <Text style={styles.hashLabel}>Transaction Hash</Text>
              <View style={styles.hashRow}>
                <Text style={styles.hashValue} numberOfLines={1} ellipsizeMode="middle">
                  {txHash}
                </Text>
                <Pressable
                  onPress={() => {
                    triggerHapticFeedback.selection();
                    handleViewExplorer();
                  }}
                  style={styles.hashAction}
                >
                  <Text style={styles.hashActionText}>View</Text>
                </Pressable>
              </View>
            </View>

            {/* Summary of what happened */}
            <View style={styles.signedSummary}>
              <Text style={styles.signedSummaryText}>
                {type === "contribution"
                  ? `Contribution of ${amount} XLM has been sent.`
                  : type === "payout"
                    ? `Payout of ${amount} XLM has been processed.`
                    : `Fee of ${fee} XLM has been paid.`}
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <Button variant="outline" size="lg" onPress={handleViewExplorer} style={styles.btn}>
              View on Stellar Expert
            </Button>
            <Button variant="primary" size="lg" onPress={handleDone} style={styles.btn}>
              Done
            </Button>
          </View>
        </SafeAreaView>
      </>
    );
  }

  // ── Confirmation state ─────────────────────────────────────────

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.animatedContent,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconWrap}>
              <Text style={styles.headerIcon}>
                {TYPE_LABEL[type]?.icon ?? "📄"}
              </Text>
            </View>
            <Text style={styles.title}>Confirm Transaction</Text>
            <Text style={styles.subtitle}>Review every detail before signing.</Text>
          </View>

          {/* Transaction Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transaction Summary</Text>
            {summaryItems.map((item, index) => (
              <React.Fragment key={item.label}>
                {index > 0 && <Divider />}
                <Row
                  label={item.label}
                  value={item.value}
                  highlight={item.highlight}
                  warn={item.warn}
                />
              </React.Fragment>
            ))}
          </View>

          {/* Risk Warnings */}
          {hasRisks && (
            <View style={styles.risksContainer}>
              {riskNotes.map((note) => (
                <View
                  key={note.message}
                  style={[
                    styles.riskCard,
                    note.severity === "critical" && styles.riskCardCritical,
                    note.severity === "warning" && styles.riskCardWarning,
                    note.severity === "info" && styles.riskCardInfo,
                  ]}
                >
                  <Text
                    style={[
                      styles.riskIcon,
                      note.severity === "critical" && styles.riskIconCritical,
                      note.severity === "warning" && styles.riskIconWarning,
                      note.severity === "info" && styles.riskIconInfo,
                    ]}
                  >
                    {note.severity === "critical"
                      ? "🚫"
                      : note.severity === "warning"
                        ? "⚠️"
                        : "ℹ️"}
                  </Text>
                  <Text
                    style={[
                      styles.riskText,
                      note.severity === "critical" && styles.riskTextCritical,
                      note.severity === "warning" && styles.riskTextWarning,
                      note.severity === "info" && styles.riskTextInfo,
                    ]}
                  >
                    {note.message}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Confirmation Checkbox */}
          <Pressable
            style={styles.checkRow}
            onPress={() => {
              triggerHapticFeedback.selection();
              setConfirmed((v) => !v);
            }}
          >
            <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
              {confirmed && <Text style={styles.checkboxIcon}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>I have verified the recipient and amount</Text>
          </Pressable>

          {/* Irreversibility Notice */}
          <View style={styles.irreversibleNotice}>
            <Text style={styles.irreversibleText}>
              ⚠️ This action cannot be undone. Please verify all details carefully.
            </Text>
          </View>
        </ScrollView>
      </Animated.View>

      {/* Actions */}
      <View style={styles.actions}>
        {submitting ? (
          <View style={styles.spinner}>
            <ActivityIndicator color="#6366F1" size="large" />
            <Text style={styles.spinnerText}>Signing transaction…</Text>
          </View>
        ) : (
          <>
            <Button
              variant="primary"
              size="lg"
              onPress={handleConfirm}
              style={styles.btn}
              disabled={!confirmed}
            >
              Confirm and Sign
            </Button>
            <Button
              variant="outline"
              size="lg"
              onPress={handleCancel}
              style={styles.btn}
            >
              Cancel
            </Button>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function Row({
  label,
  value,
  highlight,
  warn,
  mono,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
  mono?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          highlight && styles.rowValueHighlight,
          warn && styles.rowValueWarn,
          mono && styles.rowValueMono,
        ]}
        numberOfLines={1}
        ellipsizeMode="middle"
      >
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

// ── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  animatedContent: { flex: 1 },
  content: { padding: 24, gap: 16, paddingBottom: 8 },

  // Header
  header: { alignItems: "center", gap: 8, marginBottom: 8 },
  headerIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
  },
  headerIcon: { fontSize: 28 },
  title: { fontSize: 24, fontWeight: "800", color: "#F8FAFC", textAlign: "center" },
  subtitle: { fontSize: 14, color: "#94A3B8", textAlign: "center" },

  // Cards
  card: { backgroundColor: "#1E293B", borderRadius: 16, padding: 20 },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },

  // Risks
  risksContainer: { gap: 8 },
  riskCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 14,
    borderStartWidth: 3,
    borderStartColor: "#F59E0B",
  },
  riskCardCritical: { borderStartColor: "#EF4444", backgroundColor: "#2D1B1B" },
  riskCardWarning: { borderStartColor: "#F59E0B", backgroundColor: "#2D2410" },
  riskCardInfo: { borderStartColor: "#3B82F6", backgroundColor: "#1B2636" },
  riskIcon: { fontSize: 16, marginTop: 1 },
  riskIconCritical: {},
  riskIconWarning: {},
  riskIconInfo: {},
  riskText: { color: "#F59E0B", fontSize: 13, lineHeight: 18, flex: 1 },
  riskTextCritical: { color: "#FCA5A5" },
  riskTextWarning: { color: "#FDE68A" },
  riskTextInfo: { color: "#93C5FD" },

  // Rows
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowLabel: { fontSize: 14, color: "#94A3B8", flexShrink: 0 },
  rowValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F8FAFC",
    textAlign: "right",
    flex: 1,
    paddingStart: 12,
  },
  rowValueHighlight: { color: "#4ADE80", fontSize: 18 },
  rowValueWarn: { color: "#F59E0B" },
  rowValueMono: { fontFamily: "monospace", fontSize: 13 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#334155" },

  // Checkbox
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#64748B",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  checkboxIcon: { color: "#FFFFFF", fontWeight: "900", fontSize: 14 },
  checkLabel: { color: "#E2E8F0", fontSize: 14, flex: 1 },

  // Irreversibility notice
  irreversibleNotice: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 10,
    padding: 12,
    marginTop: 4,
  },
  irreversibleText: { color: "#FCA5A5", fontSize: 12, textAlign: "center", lineHeight: 18 },

  // Actions
  actions: { padding: 24, gap: 12 },
  btn: { width: "100%" },
  spinner: { alignItems: "center", gap: 12, paddingVertical: 16 },
  spinnerText: { color: "#94A3B8", fontSize: 14 },

  // Signed state
  signedContainer: { flex: 1, padding: 24, alignItems: "center", justifyContent: "center" },
  successIconWrap: { marginBottom: 28 },
  successIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#14532D",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#14532D",
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  successCheckmark: { fontSize: 64, fontWeight: "800", color: "#4ADE80", lineHeight: 64 },
  signedTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F8FAFC",
    marginBottom: 8,
    textAlign: "center",
  },
  signedSubtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  hashCard: {
    width: "100%",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
  },
  hashLabel: {
    fontSize: 11,
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  hashRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hashValue: {
    fontSize: 13,
    color: "#94A3B8",
    fontFamily: "monospace",
    flex: 1,
  },
  hashAction: {
    backgroundColor: "#1E3A5F",
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  hashActionText: { color: "#60A5FA", fontSize: 13, fontWeight: "600" },
  signedSummary: {
    marginTop: 24,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    width: "100%",
  },
  signedSummaryText: { color: "#94A3B8", fontSize: 14, textAlign: "center", lineHeight: 20 },
});
