import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export type IllustrationAssetName =
  | 'groups'
  | 'transactions'
  | 'notifications'
  | 'search'
  | 'wallet'
  | 'error'
  | 'success'
  | 'default';

export function GroupsIllustration() {
  return (
    <Svg width={112} height={112} viewBox="0 0 112 112">
      <Circle cx="36" cy="36" r="12" fill="#C7D9F5" />
      <Path d="M16 72 Q36 54 56 72" fill="#C7D9F5" />
      <Circle cx="76" cy="36" r="12" fill="#A5C4EE" />
      <Path d="M56 72 Q76 54 96 72" fill="#A5C4EE" />
      <Circle cx="56" cy="86" r="12" fill="#3B82F6" />
      <Line x1="56" y1="80" x2="56" y2="92" stroke="#FFFFFF" strokeWidth="2.5" />
      <Line x1="50" y1="86" x2="62" y2="86" stroke="#FFFFFF" strokeWidth="2.5" />
    </Svg>
  );
}

export function TransactionsIllustration() {
  return (
    <Svg width={112} height={112} viewBox="0 0 112 112">
      <Rect x="24" y="14" width="64" height="78" rx="8" fill="#EEF2FF" />
      <Rect x="24" y="14" width="64" height="78" rx="8" stroke="#C7D2FE" fill="none" />
      <Rect x="34" y="32" width="44" height="5" rx="2.5" fill="#C7D2FE" />
      <Rect x="34" y="45" width="30" height="5" rx="2.5" fill="#DDE3FB" />
      <Rect x="34" y="58" width="36" height="5" rx="2.5" fill="#DDE3FB" />
      <Circle cx="56" cy="98" r="7" fill="#EEF2FF" stroke="#C7D2FE" />
      <Line x1="53" y1="95" x2="59" y2="101" stroke="#A5B4FC" strokeWidth="1.8" />
      <Line x1="59" y1="95" x2="53" y2="101" stroke="#A5B4FC" strokeWidth="1.8" />
    </Svg>
  );
}

export function NotificationsIllustration() {
  return (
    <Svg width={112} height={112} viewBox="0 0 112 112">
      <Path
        d="M56 15 C40 15 30 28 30 44 L30 68 L22 78 L90 78 L82 68 L82 44 C82 28 72 15 56 15Z"
        fill="#E0E7FF"
        stroke="#A5B4FC"
      />
      <Circle cx="56" cy="84" r="8" fill="#C7D2FE" />
      <Line x1="74" y1="24" x2="83" y2="24" stroke="#A5B4FC" strokeWidth="1.8" />
      <Line x1="72" y1="30" x2="82" y2="30" stroke="#C7D2FE" strokeWidth="1.8" />
    </Svg>
  );
}

export function SearchIllustration() {
  return (
    <Svg width={112} height={112} viewBox="0 0 112 112">
      <Circle cx="50" cy="50" r="24" fill="#FEF3C7" stroke="#FCD34D" strokeWidth="2" />
      <Circle cx="50" cy="50" r="16" fill="#FFFBEB" />
      <Line x1="68" y1="68" x2="89" y2="89" stroke="#FCD34D" strokeWidth="6" strokeLinecap="round" />
      <Line x1="44" y1="44" x2="56" y2="56" stroke="#F59E0B" strokeWidth="2.5" />
      <Line x1="56" y1="44" x2="44" y2="56" stroke="#F59E0B" strokeWidth="2.5" />
    </Svg>
  );
}

export function WalletIllustration() {
  return (
    <Svg width={112} height={112} viewBox="0 0 112 112">
      <Rect x="16" y="34" width="80" height="48" rx="10" fill="#D1FAE5" />
      <Rect x="16" y="34" width="80" height="48" rx="10" stroke="#6EE7B7" fill="none" />
      <Rect x="62" y="52" width="28" height="18" rx="7" fill="#ECFDF5" stroke="#6EE7B7" />
      <Circle cx="76" cy="61" r="4" fill="#6EE7B7" />
      <Circle cx="38" cy="74" r="11" fill="#10B981" />
      <Line x1="38" y1="68" x2="38" y2="80" stroke="#FFFFFF" strokeWidth="2.5" />
      <Line x1="32" y1="74" x2="44" y2="74" stroke="#FFFFFF" strokeWidth="2.5" />
    </Svg>
  );
}

export function ErrorIllustration() {
  return (
    <Svg width={112} height={112} viewBox="0 0 112 112">
      <Circle cx="56" cy="56" r="32" fill="#FEE2E2" />
      <Path d="M56 36 L74 74 H38 Z" fill="#EF4444" />
      <Line x1="56" y1="48" x2="56" y2="62" stroke="#FFFFFF" strokeWidth="3" />
      <Circle cx="56" cy="68" r="2.4" fill="#FFFFFF" />
    </Svg>
  );
}

export function SuccessIllustration() {
  return (
    <Svg width={112} height={112} viewBox="0 0 112 112">
      <Circle cx="56" cy="56" r="32" fill="#DCFCE7" />
      <Circle cx="56" cy="56" r="24" fill="#22C55E" />
      <Path d="M44 56 L53 65 L69 47" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function DefaultIllustration() {
  return (
    <Svg width={112} height={112} viewBox="0 0 112 112">
      <Rect x="24" y="24" width="64" height="64" rx="14" fill="#E2E8F0" />
      <Rect x="38" y="38" width="36" height="36" rx="8" fill="#CBD5E1" />
    </Svg>
  );
}
