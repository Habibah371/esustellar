import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  ToastAndroid,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import { useRouter, useLocalSearchParams } from "expo-router";
import Button from "../../../components/ui/Button";

export default function GroupCreatedSuccess() {
  const router = useRouter();
  const { groupId, inviteCode, groupName } = useLocalSearchParams<{
    groupId: string;
    inviteCode: string;
    groupName: string;
  }>();

  const [copied, setCopied] = useState(false);
  const code = inviteCode ?? "ESU-ABCD-1234";
  const id = groupId ?? "new";

  const showToast = (message: string) => {
    if (Platform.OS === "android") {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert("", message);
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    showToast("Invite code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    await Share.share({ message: `Join my EsuStellar savings group with code: ${code}` });
  };

  const handleViewGroup = () => {
    // replace so user cannot navigate back to this screen
    router.replace(`/groups/${id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🎉</Text>
        <Text style={styles.headline}>Group Created!</Text>
        {!!groupName && <Text style={styles.subtext}>{groupName}</Text>}

        <Text style={styles.codeLabel}>Your Invite Code</Text>
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{code}</Text>
        </View>

        <TouchableOpacity style={[styles.btn, styles.outlineBtn]} onPress={handleCopy}>
          <Text style={styles.outlineBtnText}>{copied ? "Copied!" : "Copy Invite Code"}</Text>
        </TouchableOpacity>

        <Button onPress={handleShare} variant="secondary" style={styles.actionBtn}>
          Share Invite Code
        </Button>

        <Button onPress={handleViewGroup} style={styles.actionBtn}>
          View My Group
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  icon: { fontSize: 64, marginBottom: 16 },
  headline: { fontSize: 28, fontWeight: "700", color: "#fff", marginBottom: 4 },
  subtext: { fontSize: 16, color: "#94A3B8", marginBottom: 24 },
  codeLabel: { fontSize: 13, color: "#64748B", marginBottom: 8 },
  codeBox: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#334155",
  },
  codeText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#6366F1",
    letterSpacing: 4,
  },
  btn: { width: "100%", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginBottom: 12 },
  outlineBtn: { borderWidth: 1, borderColor: "#6366F1", backgroundColor: "transparent" },
  outlineBtnText: { color: "#6366F1", fontSize: 16, fontWeight: "600" },
  actionBtn: { width: "100%", marginBottom: 12 },
});
