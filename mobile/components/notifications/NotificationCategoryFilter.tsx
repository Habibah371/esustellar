import React, { useCallback } from 'react';
import { ScrollView, Pressable, Text, StyleSheet } from 'react-native';
import { NotificationCategory, NOTIFICATION_CATEGORIES } from '../../types/notification';

type NotificationCategoryFilterProps = {
  selectedCategory: NotificationCategory;
  onCategoryChange: (category: NotificationCategory) => void;
};

export function NotificationCategoryFilter({
  selectedCategory,
  onCategoryChange,
}: NotificationCategoryFilterProps) {
  const categories = Object.keys(NOTIFICATION_CATEGORIES) as NotificationCategory[];

  const handleCategoryPress = useCallback(
    (category: NotificationCategory) => {
      onCategoryChange(category);
    },
    [onCategoryChange],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {categories.map((category) => {
        const isSelected = category === selectedCategory;
        const categoryInfo = NOTIFICATION_CATEGORIES[category];

        return (
          <Pressable
            key={category}
            onPress={() => handleCategoryPress(category)}
            style={({ pressed }) => [
              styles.filterButton,
              isSelected && styles.filterButtonSelected,
              pressed && styles.filterButtonPressed,
            ]}
          >
            <Text style={styles.emoji}>{categoryInfo.emoji}</Text>
            <Text
              style={[
                styles.label,
                isSelected && styles.labelSelected,
              ]}
            >
              {categoryInfo.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  contentContainer: {
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  filterButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#EEF6FF',
  },
  filterButtonPressed: {
    opacity: 0.7,
  },
  emoji: {
    fontSize: 14,
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#374151',
  },
  labelSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
