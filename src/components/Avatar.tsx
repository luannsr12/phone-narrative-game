import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { theme } from '@/theme';

interface Props {
  initials: string;
  color?: string;
  size?: number;
  /** Render as an unknown/locked contact (silhouette, muted, no photo). */
  unknown?: boolean;
  /** Remote profile photo; only shown for identified contacts. */
  url?: string;
}

/** Contact avatar: remote photo when available, otherwise tinted initials. */
export function Avatar({ initials, color, size = 44, unknown, url }: Props) {
  const radius = size / 2;

  if (!unknown && url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: theme.colors.surfaceHigh }}
      />
    );
  }

  const bg = unknown ? theme.colors.surfaceHigh : color ?? theme.colors.accentDim;
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: radius, backgroundColor: bg }]}>
      <Text style={[styles.text, { fontSize: size * 0.38 }]}>{unknown ? '?' : initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  text: { color: theme.colors.text, fontWeight: '700' },
});
