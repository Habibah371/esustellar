import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Svg, { Circle, Path, Rect, Ellipse, Line } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';

export type EmptyStateIllustration = 'groups' | 'transactions' | 'notifications' | 'default';

function GroupsIllustration() {
  return (
    <Svg width={132} height={132} viewBox="0 0 120 120">
      <Circle cx="40" cy="38" r="14" fill="#C7D9F5" />
      <Path d="M16 80 Q40 58 64 80" fill="#C7D9F5" />
      <Circle cx="80" cy="38" r="14" fill="#A5C4EE" />
      <Path d="M56 80 Q80 58 104 80" fill="#A5C4EE" />
      <Circle cx="60" cy="90" r="14" fill="#3B82F6" />
      <Line x1="60" y1="84" x2="60" y2="96" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <Line x1="54" y1="90" x2="66" y2="90" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </Svg>
  );
}

function TransactionsIllustration() {
  return (
    <Svg width={132} height={132} viewBox="0 0 120 120">
      <Rect x="25" y="15" width="70" height="85" rx="6" fill="#EEF2FF" />
      <Rect x="25" y="15" width="70" height="85" rx="6" stroke="#C7D2FE" strokeWidth="1.5" fill="none" />
      <Path
        d="M25 85 L30 90 L35 85 L40 90 L45 85 L50 90 L55 85 L60 90 L65 85 L70 90 L75 85 L80 90 L85 85 L90 90 L95 85"
        stroke="#C7D2FE"
        strokeWidth="1.5"
        fill="none"
      />
      <Rect x="35" y="35" width="50" height="5" rx="2.5" fill="#C7D2FE" />
      <Rect x="35" y="48" width="35" height="5" rx="2.5" fill="#DDE3FB" />
      <Rect x="35" y="61" width="42" height="5" rx="2.5" fill="#DDE3FB" />
      <Circle cx="60" cy="104" r="8" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.5" />
      <Line x1="57" y1="101" x2="63" y2="107" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" />
      <Line x1="63" y1="101" x2="57" y2="107" stroke="#A5B4FC" strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

function NotificationsIllustration() {
  return (
    <Svg width={132} height={132} viewBox="0 0 120 120">
      <Path
        d="M60 15 C42 15 30 30 30 48 L30 75 L20 85 L100 85 L90 75 L90 48 C90 30 78 15 60 15Z"
        fill="#E0E7FF"
        stroke="#A5B4FC"
        strokeWidth="1.5"
      />
      <Ellipse cx="60" cy="90" rx="10" ry="5" fill="#C7D2FE" />
      <Path
        d="M78 25 L86 25 L78 33 L86 33"
        stroke="#A5B4FC"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M88 18 L93 18 L88 23 L93 23"
        stroke="#C7D2FE"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function DefaultIllustration() {
  return (
    <Svg width={132} height={132} viewBox="0 0 120 120">
      <Rect x="22" y="28" width="76" height="64" rx="12" fill="#E2E8F0" />
      <Rect x="22" y="28" width="76" height="64" rx="12" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
      <Circle cx="46" cy="54" r="6" fill="#94A3B8" />
      <Circle cx="74" cy="54" r="6" fill="#94A3B8" />
      <Path d="M44 74 Q60 84 76 74" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" fill="none" />
    </Svg>
  );
}

function Illustration({ type }: { type: EmptyStateIllustration }) {
  switch (type) {
    case 'groups':
      return <GroupsIllustration />;
    case 'transactions':
      return <TransactionsIllustration />;
    case 'notifications':
      return <NotificationsIllustration />;
    default:
      return <DefaultIllustration />;
  }
}

type Tone = 'light' | 'dark' | 'auto';

interface Props {
  title: string;
  message: string;
  illustration?: EmptyStateIllustration;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
  tone?: Tone;
}

export function EmptyState({ title, message, illustration, icon, actionLabel, onAction, tone = 'auto' }: Props) {
  const { resolvedColorScheme, colors } = useTheme();
  const effectiveTone = tone === 'auto' ? resolvedColorScheme : tone;
  const titleColor = effectiveTone === 'dark' ? '#F1F5F9' : '#0F172A';
  const messageColor = effectiveTone === 'dark' ? '#94A3B8' : '#64748B';
  const buttonBg = effectiveTone === 'dark' ? '#334155' : colors.accent;
  const buttonText = effectiveTone === 'dark' ? '#F1F5F9' : '#FFFFFF';

  return (
    <View style={styles.container}>
      <View style={styles.illustration}>
        {illustration ? <Illustration type={illustration} /> : icon ? <Text style={styles.icon}>{icon}</Text> : <Illustration type="default" />}
      </View>
      <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
      <Text style={[styles.message, { color: messageColor }]}>{message}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} style={[styles.button, { backgroundColor: buttonBg }]} disabled={!onAction}>
          <Text style={[styles.buttonText, { color: buttonText }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  illustration: { marginBottom: 18, opacity: 0.98 },
  icon: { fontSize: 48 },
  title: { fontSize: 18, fontWeight: '700', marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 14, textAlign: 'center', marginBottom: 18, lineHeight: 20 },
  button: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 18 },
  buttonText: { fontWeight: '700', fontSize: 14 },
});

