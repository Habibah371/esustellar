import React, { useMemo } from 'react';
import { ScrollView, View, Text, StyleSheet, RefreshControl } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useRefresh } from '../../hooks/useRefresh';
import { useInvalidateGroups } from '../../hooks/useGroups';
import { logger } from '../../services/logger';

export default function GroupsScreen() {
  const { colors } = useTheme();
  const invalidateGroups = useInvalidateGroups();

  const fetchData = useMemo(() => async () => {
    logger.info('GroupsScreen', 'Refreshing groups data');
    await invalidateGroups();
  }, [invalidateGroups]);

  const { refreshing, onRefresh } = useRefresh(fetchData);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
          colors={[colors.accent]}
        />
      }
    >
      <Text style={[styles.title, { color: colors.text }]}>Groups</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, flexGrow: 1 },
  title: { fontSize: 28, fontWeight: '800' },
});
