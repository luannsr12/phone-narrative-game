import React, { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/theme';
import { Avatar } from '@/components/Avatar';
import type { Ad } from '@/types/story';

interface Props {
  ad: Ad;
  onPress: () => void;
}

/** Deterministic handle from the brand name, e.g. "Tulu Bank" → "tulubank". */
function handleOf(brand: string): string {
  return brand.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '') || 'patrocinado';
}

/**
 * A Mural sponsored post — visually identical to a normal feed card, but the
 * "Patrocinado" label and the call-to-action strip below the image mark it as
 * an ad (exactly how Instagram presents sponsored posts). Tapping the image or
 * the CTA opens the ad's fictional landing page.
 */
export function AdCard({ ad, onPress }: Props) {
  const [liked, setLiked] = useState(false);
  const handle = handleOf(ad.brand);
  const cta = ad.cta?.trim() || 'Saiba mais';

  return (
    <View style={styles.post}>
      <Pressable style={styles.head} onPress={onPress}>
        <Avatar initials={(ad.brand[0] ?? '?').toUpperCase()} url={ad.avatarUrl} size={34} />
        <View style={{ flex: 1 }}>
          <Text style={styles.author}>{ad.brand}</Text>
          <Text style={styles.sponsored}>Patrocinado</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={16} color={theme.colors.textDim} />
      </Pressable>

      <Pressable onPress={onPress}>
        {ad.imageUrl ? (
          <Image source={{ uri: ad.imageUrl }} style={styles.image} />
        ) : (
          <LinearGradient
            colors={['#22303C', '#162029']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.image}
          >
            <Text style={styles.placeholder}>{ad.brand}</Text>
          </LinearGradient>
        )}
      </Pressable>

      {/* Instagram-style CTA strip directly under the creative. */}
      <Pressable style={styles.ctaBar} onPress={onPress}>
        <Text style={styles.ctaText}>{cta}</Text>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.text} />
      </Pressable>

      <View style={styles.actions}>
        <Pressable onPress={() => setLiked((v) => !v)} hitSlop={8}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={24}
            color={liked ? '#E5687A' : theme.colors.text}
          />
        </Pressable>
        <Pressable onPress={onPress} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={22} color={theme.colors.text} />
        </Pressable>
        <Pressable onPress={onPress} hitSlop={8}>
          <Ionicons name="paper-plane-outline" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Ionicons name="bookmark-outline" size={22} color={theme.colors.text} />
      </View>

      <Text style={styles.caption}>
        <Text style={styles.captionAuthor}>{handle} </Text>
        {ad.caption}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  post: { paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  author: { color: theme.colors.text, fontSize: 13.5, fontWeight: '700' },
  sponsored: { color: theme.colors.textFaint, fontSize: 11 },
  image: { width: '100%', aspectRatio: 1, backgroundColor: theme.colors.surfaceHigh, alignItems: 'center', justifyContent: 'center' },
  placeholder: { color: theme.colors.textDim, fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  ctaBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  ctaText: { color: theme.colors.text, fontSize: 13.5, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 12, paddingTop: 10 },
  caption: { color: theme.colors.text, fontSize: 13.5, lineHeight: 19, paddingHorizontal: 12, marginTop: 8 },
  captionAuthor: { fontWeight: '700' },
});
