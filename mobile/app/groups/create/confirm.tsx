import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { triggerHapticFeedback } from "../../utils/haptics";

export default function ConfirmGroupScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    groupName: string;
    description: string;
    maxMembers: string;
    contributionAmount: string;
    payoutFrequency: string;
  }>();

  const [loading, setLoading] = useState(false);

  const groupName = params.groupName ?? "";
  const description = params.description ?? "";
  const maxMembers = Number(params.maxMembers ?? 0);
  const contributionAmount = Number(params.contributionAmount ?? 0);
  const payoutFrequency = params.payoutFrequency ?? "monthly";
  const totalPool = contributionAmount * maxMembers;

  const handleCreate = async () => {
    setLoading(true);
    try {
      console.log("Creating group:", { groupName, description, maxMembers, contributionAmount, payoutFrequency });
      triggerHapticFeedback.success();
      // Navigate to the new group detail screen on success
      const newGroupId = "new-group-" + Date.now();
      router.replace(`/groups/${newGroupId}`);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => { triggerHapticFeedback.warning(); router.back(); }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review & Confirm</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Group Settings</Text>

        <View style={styles.card}>
          <Row label="Group Name" value={groupName} />
          <Row label="Description" value={description} />
          <Row label="Max Members" value={String(maxMembers)} />
          <Row label="Contribution" value={`$${contributionAmount}`} />
          <Row label="Payout Frequency" value={payoutFrequency} />
          <Row label="Total Pool" value={`$${totalPool}`} />
        </View>

        <View style={styles.disclaimer}>
          <Ionicons name="information-circle-outline" size={18} color="#F59E0B" />
          <Text style={styles.disclaimerText}>
            Once created, contribution settings cannot be changed.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.createButtonText}>Create Group</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "600", color: "#fff" },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: "600", color: "#94A3B8", marginBottom: 12 },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  rowLabel: { fontSize: 14, color: "#64748B", flex: 1 },
  rowValue: { fontSize: 14, color: "#fff", fontWeight: "500", flex: 2, textAlign: "right" },
  disclaimer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1E293B",
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: "#F59E0B",
  },
  disclaimerText: { flex: 1, fontSize: 13, color: "#F59E0B", lineHeight: 18 },
  createButton: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  createButtonDisabled: { opacity: 0.5 },
  createButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
