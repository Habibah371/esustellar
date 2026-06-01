import React from 'react';
import { SafeAreaView, ScrollView, Text, StyleSheet, View } from 'react-native';

const SECTIONS = [
  {
    heading: '1. Acceptance of Terms',
    body: 'By accessing or using the EsuStellar application, you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not use the application.',
  },
  {
    heading: '2. Description of Service',
    body: 'EsuStellar provides a decentralised savings group platform built on the Stellar blockchain. Users can create or join rotating savings groups, make contributions, and receive payouts according to a predetermined schedule.',
  },
  {
    heading: '3. Eligibility',
    body: 'You must be at least 18 years of age and capable of forming a binding agreement. You are responsible for ensuring your use complies with applicable local laws and regulations.',
  },
  {
    heading: '4. Wallet and Account Security',
    body: 'You are solely responsible for maintaining the confidentiality and security of your Stellar wallet credentials, recovery phrases, and PINs. EsuStellar cannot recover lost keys or reverse unauthorised transactions.',
  },
  {
    heading: '5. Contributions and Payouts',
    body: 'All contributions are recorded on-chain and subject to the group\'s agreed schedule. Failure to contribute on time may result in penalties as defined by the group rules. Payouts are distributed automatically in rotating order.',
  },
  {
    heading: '6. Prohibited Conduct',
    body: 'You agree not to: use the platform for money laundering or illegal activities; attempt to exploit smart contract vulnerabilities; impersonate other users; or interfere with the normal operation of the platform.',
  },
  {
    heading: '7. Limitation of Liability',
    body: 'EsuStellar is provided "as is" without warranties of any kind. We are not liable for losses resulting from blockchain network failures, smart contract bugs, wallet compromises, or actions of other group members.',
  },
  {
    heading: '8. Modifications',
    body: 'We reserve the right to update these terms at any time. Continued use of the application after changes constitutes acceptance of the revised terms.',
  },
  {
    heading: '9. Contact',
    body: 'For questions regarding these terms, reach out to support@esustellar.app.',
  },
];

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Terms of Service</Text>
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
