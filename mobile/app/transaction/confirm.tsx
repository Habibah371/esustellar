import React, { useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Button from "../../components/ui/Button";
import { triggerHapticFeedback } from "../../utils/haptics";

type TxType = "contribution" | "payout" | "fee";

const TYPE_LABEL: Record<TxType, string> = {
  contribution: "Contribution",
  payout: "Payout",
  fee: "Fee",
};

function truncate(addr: string) {
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function TransactionConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string;
    amount?: string;
    destination?: string;
    fee?: string;
    memo?: string;
  }>();

  const type = (params.type ?? "contribution") as TxType;
  const amount = params.amount ?? "0";
  const destination = params.destination ?? "";
  const fee = params.fee ?? "0.00001";
  const memo = params.memo ?? "";

  const numericFee = Number.parseFloat(fee);
  const isHighFee = Number.isFinite(numericFee) && numericFee > 0.01;

  const riskNote = useMemo(() => {
    if (!destination) return "No destination account set. Cancel if unintentional.";
    if (isHighFee) return "Network fee is higher than usual. Verify before signing.";
    return "Always verify the recipient and amount — blockchain payments are irreversible.";
  }, [destination, isHighFee]);

  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = async () => {
    triggerHapticFeedback.success();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1500));
    router.replace({
      pathname: "/transaction/success",
      params: { txHash: "mock_tx_hash_" + Date.now() },
    });
  };

  const handleCancel = () => {
    triggerHapticFeedback.warning();
    // Cancel returns to previous screen without signing
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Confirm Transaction</Text>
        <Text style={styles.subtitle}>Review every detail before signing.</Text>

        <View style={styles.card}>
          <Row label="Type" value={TYPE_LABEL[type] ?? type} />
          <Divider />
          <Row label="You are sending" value={`${amount} XLM`} highlight />
          <Divider />
          {!!destination && (
            <>
              <Row label="To" value={truncate(destination)} mono />
              <Divider />
            </>
          )}
          <Row label="Network Fee" value={`${fee} XLM`} warn={isHighFee} />
          {!!memo && (
            <>
              <Divider />
              <Row label="Memo" value={memo} />
            </>
          )}
        </View>

        <View style={[styles.card, styles.riskCard]}>
          <Text style={styles.riskText}>{riskNote}</Text>
        </View>

        <Pressable
          style={styles.checkRow}
          onPress={() => { triggerHapticFeedback.selection(); setConfirmed((v) => !v); }}
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            <Text style={styles.checkboxIcon}>{confirmed ? "✓" : ""}</Text>
          </View>
          <Text style={styles.checkLabel}>I have verified the recipient and amount</Text>
        </Pressable>
      </ScrollView>

      <View style={styles.actions}>
        {submitting ? (
          <View style={styles.spinner}>
            <ActivityIndicator color="#6366F1" size="large" />
            <Text style={styles.spinnerText}>Submitting transaction…</Text>
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
      >
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  content: { padding: 24, gap: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: "800", color: "#F8FAFC", marginBottom: 6 },
  subtitle: { fontSize: 14, color: "#94A3B8", marginBottom: 8 },
  card: { backgroundColor: "#1E293B", borderRadius: 16, padding: 20 },
  riskCard: { borderLeftWidth: 3, borderLeftColor: "#F59E0B" },
  riskText: { color: "#F59E0B", fontSize: 13, lineHeight: 18 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowLabel: { fontSize: 14, color: "#94A3B8" },
  rowValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F8FAFC",
    textAlign: "right",
    flex: 1,
    paddingLeft: 12,
  },
  rowValueHighlight: { color: "#4ADE80", fontSize: 18 },
  rowValueWarn: { color: "#F59E0B" },
  rowValueMono: { fontFamily: "monospace", fontSize: 13 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#334155" },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#64748B",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: { backgroundColor: "#6366F1", borderColor: "#6366F1" },
  checkboxIcon: { color: "#FFFFFF", fontWeight: "900" },
  checkLabel: { color: "#E2E8F0", fontSize: 14, flex: 1 },
  actions: { padding: 24, gap: 12 },
  btn: { width: "100%" },
  spinner: { alignItems: "center", gap: 12, paddingVertical: 16 },
  spinnerText: { color: "#94A3B8", fontSize: 14 },
});
