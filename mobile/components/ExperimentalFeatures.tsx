import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { EXPERIMENTAL_FEATURES } from '../services/experimentalFeatures';

export default function ExperimentalFeatures() {
  const { colors } = useTheme();

  return (
    <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>Experimental</Text>
      <Text style={[styles.subtitle, { color: colors.subtext }]}>
        Future-facing features that are wired into the app shell now, but intentionally kept behind a roadmap label.
      </Text>
      {EXPERIMENTAL_FEATURES.map((feature) => (
        <View key={feature.key} style={[styles.row, { borderColor: colors.border }]}>
          <Text style={[styles.featureTitle, { color: colors.text }]}>{feature.title}</Text>
          <Text style={[styles.featureStatus, { color: colors.accent }]}>
            {feature.status}
          </Text>
          <Text style={[styles.featureDescription, { color: colors.subtext }]}>
            {feature.description}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  row: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 4,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  featureStatus: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  featureDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
});
