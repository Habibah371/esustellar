'use client';

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Avatar } from '../ui/Avatar';

type Member = {
  address: string;
  name?: string;
};

interface MemberAvatarStackProps {
  members: Member[];
  maxVisible?: number;
  onViewAll?: () => void;
}

export function MemberAvatarStack({
  members,
  maxVisible = 5,
  onViewAll,
}: MemberAvatarStackProps) {
  const visibleMembers = members.slice(0, maxVisible);
  const extraCount = Math.max(0, members.length - visibleMembers.length);

  return (
    <View style={styles.container}>
      <View style={styles.avatarRow}>
        {visibleMembers.map((member, index) => (
          <View
            key={member.address}
            style={[
              styles.avatarWrapper,
              index !== 0 && styles.overlap,
              { zIndex: visibleMembers.length - index },
            ]}
          >
            <Avatar name={member.name ?? member.address} size="md" />
          </View>
        ))}

        {extraCount > 0 && (
          <View style={[styles.extraBadge, { marginStart: visibleMembers.length ? -12 : 0 }]}> 
            <Text style={styles.extraText}>+{extraCount}</Text>
          </View>
        )}
      </View>

      <Pressable onPress={onViewAll} style={styles.viewAllPressable}>
        <Text style={styles.viewAllText}>View All Members</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  overlap: {
    marginStart: -12,
  },
  extraBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  extraText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  viewAllPressable: {
    marginTop: 12,
  },
  viewAllText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
});
