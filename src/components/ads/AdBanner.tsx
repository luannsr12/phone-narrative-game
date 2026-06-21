import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/theme';
import type { Ad } from '@/types/story';

interface Props {
  ad: Ad;
  onPress: () => void;
}

/**
 * A website banner ad — the kind that sits between content blocks on real news
 * sites. A thumbnail, the brand, one line of copy and a CTA, with a small
 * "Anúncio" tag so it reads as paid placement, not editorial content.
 */
export function AdBanner({ ad, onPress }: Props) {
  const cta = ad.cta?.trim() || 'Saiba mais';
  const domain = (ad.url ?? '').replace(/^https?:\/\//, '').split('/')[0];

  return (
    <Pressable style={styles.banner} onPress={onPress}>
      <View style={styles.tag}>
        <Text style={styles.tagText}>Anúncio</Text>
      </View>
      {ad.imageUrl ? (
        <Image source={{ uri: ad.imageUrl }} style={styles.thumb} />
      ) : (
        <LinearGradient colors={['#22303C', '#162029']} style={styles.thumb}>
          <Text style={styles.thumbInitial}>{(ad.brand[0] ?? '?').toUpperCase()}</Text>
        </LinearGradient>
      )}
      <View style={styles.body}>
        <Text style={styles.brand} numberOfLines={1}>
          {ad.brand}
        </Text>
        <Text style={styles.caption} numberOfLines={2}>
          {ad.caption}
        </Text>
        <View style={styles.ctaRow}>
          <Text style={styles.cta}>{cta}</Text>
          <Ionicons name="open-outline" size={12} color={theme.colors.accent} />
          {domain ? <Text style={styles.domain} numberOfLines={1}>{domain}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  tag: {
    position: 'absolute',
    top: 6,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  tagText: { color: theme.colors.textFaint, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbInitial: { color: theme.colors.textDim, fontSize: 24, fontWeight: '800' },
  body: { flex: 1, justifyContent: 'center' },
  brand: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  caption: { color: theme.colors.textDim, fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  cta: { color: theme.colors.accent, fontSize: 12.5, fontWeight: '700' },
  domain: { color: theme.colors.textFaint, fontSize: 11, flex: 1 },
});
