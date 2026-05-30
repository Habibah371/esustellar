import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput as RNTextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const INVITE_CODE_REGEX = /^[A-Z0-9]{4,12}$/;

interface GroupPreview {
  groupId: string;
  groupName: string;
  memberCount: number;
  maxMembers: number;
  contributionAmount: number;
}

export default function JoinGroupScreen() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [groupPreview, setGroupPreview] = useState<GroupPreview | null>(null);
  const [error, setError] = useState("");

  const handleCodeChange = (value: string) => {
    const upper = value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
    setInviteCode(upper);
    setError("");
    if (groupPreview) setGroupPreview(null);
  };

  const handleJoin = async () => {
    const code = inviteCode.trim();

    if (!code) {
      setError("Invite code is required");
      return;
    }

    if (!INVITE_CODE_REGEX.test(code.replace(/-/g, ""))) {
      setError("Invalid invite code format");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Validate code and show group preview
      setGroupPreview({
        groupId: "mock-id",
        groupName: "Savings Circle",
        memberCount: 4,
        maxMembers: 10,
        contributionAmount: 100,
      });
    } catch {
      setError("Failed to validate invite code");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmJoin = async () => {
    if (!groupPreview) return;
    setJoining(true);
    try {
      console.log("Joining group with code:", inviteCode);
      router.replace(`/groups/${groupPreview.groupId}`);
    } catch {
      setError("Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Join Group</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.label}>Invite Code</Text>
        <RNTextInput
          style={styles.input}
          value={inviteCode}
          onChangeText={handleCodeChange}
          placeholder="Enter invite code"
          placeholderTextColor="#64748B"
          autoCapitalize="characters"
          autoCorrect={false}
        />

        {!!error && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.joinButton, loading && styles.disabled]}
          onPress={handleJoin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.joinButtonText}>Join</Text>
          )}
        </TouchableOpacity>

        {groupPreview && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{groupPreview.groupName}</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Members</Text>
              <Text style={styles.previewValue}>
                {groupPreview.memberCount}/{groupPreview.maxMembers}
              </Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>Contribution</Text>
              <Text style={styles.previewValue}>${groupPreview.contributionAmount}</Text>
            </View>

            <TouchableOpacity
              style={[styles.confirmButton, joining && styles.disabled]}
              onPress={handleConfirmJoin}
              disabled={joining}
            >
              {joining ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.joinButtonText}>Confirm Join</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
  label: { fontSize: 14, color: "#94A3B8", marginBottom: 8 },
  input: {
    backgroundColor: "#1E293B",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 16,
    letterSpacing: 2,
    marginBottom: 12,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1E293B",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  errorText: { color: "#EF4444", fontSize: 13, flex: 1 },
  joinButton: {
    backgroundColor: "#6366F1",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 24,
  },
  disabled: { opacity: 0.5 },
  joinButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  previewCard: { backgroundColor: "#1E293B", borderRadius: 12, padding: 20, gap: 12 },
  previewTitle: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 4 },
  previewRow: { flexDirection: "row", justifyContent: "space-between" },
  previewLabel: { fontSize: 14, color: "#64748B" },
  previewValue: { fontSize: 14, color: "#fff", fontWeight: "500" },
  confirmButton: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
});
