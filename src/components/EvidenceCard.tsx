import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { stamp } from '@/utils/format';
import type { Evidence } from '@/types/story';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export const EVIDENCE_ICON: Record<Evidence['kind'], IconName> = {
  photo: 'image',
  video: 'videocam',
  audio: 'mic',
  document: 'document-text',
  screenshot: 'phone-portrait',
  location: 'location',
  report: 'newspaper',
};

interface Props {
  evidence: Evidence;
  receivedAt: number;
  fromName: string;
  onPress: () => void;
}

export function EvidenceCard({ evidence, receivedAt, fromName, onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <View style={[styles.thumb, { backgroundColor: evidence.thumbnailColor ?? theme.colors.surfaceHigh }]}>
        <Ionicons name={EVIDENCE_ICON[evidence.kind]} size={22} color="#C9D2DF" />
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {evidence.title}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>
          {evidence.description}
        </Text>
        <Text style={styles.meta}>
          {fromName} · {stamp(receivedAt)}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={15} color={theme.colors.textFaint} style={styles.chev} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    marginHorizontal: 12,
    marginVertical: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  pressed: { backgroundColor: theme.colors.surfaceAlt },
  thumb: { width: 52, height: 52, borderRadius: theme.radius.sm, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 15, fontWeight: '700' },
  desc: { color: theme.colors.textDim, fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  meta: { color: theme.colors.textFaint, fontSize: 11, marginTop: 6 },
  chev: { marginLeft: -4 },
});
