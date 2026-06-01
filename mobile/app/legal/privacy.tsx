import React from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View } from 'react-native';

const SECTIONS = [
  {
    heading: '1. Information We Collect',
    body: 'We collect your Stellar wallet public key when you connect a wallet. We also collect contribution activity data (amounts, timestamps, group IDs) to display your savings history. We do not collect private keys, recovery phrases, or personally identifiable information beyond what you voluntarily provide.',
  },
  {
    heading: '2. How We Use Your Information',
    body: 'Your wallet address and contribution data are used solely to operate the EsuStellar platform — to display group balances, track payout schedules, and send contribution reminders. We do not use your data for advertising or sell it to third parties.',
  },
  {
    heading: '3. Data Storage and Security',
    body: 'Contribution records are stored on the Stellar blockchain, which is public and immutable. App preferences and session data are stored locally on your device using AsyncStorage and Expo SecureStore. Sensitive data such as PIN hashes and biometric enrollment are encrypted using platform-provided secure storage.',
  },
  {
    heading: '4. On-Chain Data',
    body: 'All transactions submitted to the Stellar network are publicly visible by design. Your wallet public key and transaction amounts are permanently recorded on-chain. EsuStellar has no ability to alter or remove on-chain data.',
  },
  {
    heading: '5. Security Logs',
    body: 'We retain security and error logs for up to 90 days to detect fraud, debug issues, and maintain platform integrity. Logs may include device type, app version, and anonymised event data. Logs do not include wallet private keys or personal identifiers.',
  },
  {
    heading: '6. Third-Party Services',
    body: 'EsuStellar integrates with the Stellar Horizon API for blockchain queries and push notification services for contribution reminders. These services operate under their own privacy policies. We share only the minimum data necessary to deliver each service.',
  },
  {
    heading: '7. Your Rights',
    body: 'Because the core data is stored on a public blockchain, we cannot delete on-chain transaction records. You may clear locally stored preferences at any time by disconnecting your wallet or uninstalling the app. To request deletion of any off-chain data we hold, contact support@esustellar.app.',
  },
  {
    heading: '8. Children\'s Privacy',
    body: 'EsuStellar is not directed at individuals under 18 years of age. We do not knowingly collect data from minors. If you believe a minor has used the service, please contact us immediately.',
  },
  {
    heading: '9. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. Significant changes will be communicated via an in-app notification. Continued use of EsuStellar after changes are posted constitutes your acceptance of the revised policy.',
  },
  {
    heading: '10. Contact',
    body: 'For privacy questions or data requests, contact us at support@esustellar.app.',
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.lastUpdated}>Last updated: May 2026</Text>

        {SECTIONS.map((section) => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0F172A' },
  container: { padding: 24, paddingBottom: 48 },
  title: { fontSize: 26, fontWeight: '800', color: '#F8FAFC', marginBottom: 4 },
  lastUpdated: { fontSize: 13, color: '#64748B', marginBottom: 24 },
  section: { marginBottom: 20 },
  heading: { fontSize: 16, fontWeight: '700', color: '#E2E8F0', marginBottom: 6 },
  body: { fontSize: 15, lineHeight: 22, color: '#94A3B8' },
});
