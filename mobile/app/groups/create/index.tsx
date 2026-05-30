import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TextInput } from '../../../components/ui/TextInput';
import Button from '../../../components/ui/Button';

const MAX_NAME = 50;
const MAX_DESC = 200;

export default function CreateGroupStep1() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [nameError, setNameError] = useState('');

  const handleNext = () => {
    if (!name.trim()) {
      setNameError('Group name is required');
      return;
    }
    setNameError('');
    router.push({
      pathname: '/groups/create/settings',
      params: { groupName: name.trim(), description: description.trim() },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
        <View style={{ width: 40 }} />
      </View>

      <Text style={styles.step}>Step 1 of 3</Text>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TextInput
          label="Group Name *"
          value={name}
          onChangeText={(v) => {
            setName(v.slice(0, MAX_NAME));
            if (nameError) setNameError('');
          }}
          placeholder="Enter group name"
          error={nameError}
          maxLength={MAX_NAME}
        />
        <Text style={styles.charCount}>{name.length}/{MAX_NAME}</Text>

        <TextInput
          label="Description (optional)"
          value={description}
          onChangeText={(v) => setDescription(v.slice(0, MAX_DESC))}
          placeholder="What is this group about?"
          multiline
          numberOfLines={4}
          style={styles.textArea}
          maxLength={MAX_DESC}
        />
        <Text style={styles.charCount}>{description.length}/{MAX_DESC}</Text>

        <View style={styles.actions}>
          <Button variant="outline" onPress={() => router.back()} style={styles.cancelBtn}>
            Cancel
          </Button>
          <Button onPress={handleNext} disabled={!name.trim()} style={styles.nextBtn}>
            Next
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  step: { fontSize: 13, color: '#64748B', textAlign: 'center', marginBottom: 8 },
  content: { padding: 16, paddingBottom: 40 },
  textArea: { height: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: '#64748B', textAlign: 'right', marginTop: -8, marginBottom: 12 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: { flex: 1 },
  nextBtn: { flex: 1 },
});