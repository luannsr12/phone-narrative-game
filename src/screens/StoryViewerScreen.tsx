import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, Image, Animated, Easing, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { useGameStore, selectStoryGroups, selectPlayerStory } from '@/store/gameStore';
import { getSocialProfile } from '@/utils/social';
import { mediaUrl } from '@/utils/media';
import type { Screen } from '@/navigation/types';

const DEFAULT_SEC = 5;
const TAP_MS = 250;

/**
 * Fullscreen Mural story player: segmented progress bars, tap right/left to
 * navigate, hold to pause, auto-advance through every author with unseen
 * stories — the Instagram-style behavior players expect.
 */
export function StoryViewerScreen({ navigation, route }: Screen<'StoryViewer'>) {
  const { author } = route.params;
  const isPlayer = author === 'player';
  const baseGroups = useGameStore((s) => selectStoryGroups(s.state));
  const playerStory = useGameStore((s) => selectPlayerStory(s.state));
  const playerName = useGameStore((s) => s.state?.playerName);
  const markStorySeen = useGameStore((s) => s.markStorySeen);

  // The player's own story is viewed in isolation; everyone else auto-advances
  // through the followed feed.
  const groups = useMemo(
    () => (isPlayer ? (playerStory ? [playerStory] : []) : baseGroups),
    [isPlayer, playerStory, baseGroups],
  );

  const startGroup = Math.max(
    0,
    groups.findIndex((g) => g.author === author),
  );
  const [groupIdx, setGroupIdx] = useState(startGroup);
  const [itemIdx, setItemIdx] = useState(0);

  const group = groups[groupIdx];
  const item = group?.items[itemIdx];
  const ch = item ? getSocialProfile(item.author, playerName) : undefined;

  // --- timed progress -------------------------------------------------------
  const progress = useRef(new Animated.Value(0)).current;
  const pressedAt = useRef(0);

  const durationMs = (item?.durationSec ?? DEFAULT_SEC) * 1000;

  const goNext = () => {
    if (!group) return;
    if (itemIdx + 1 < group.items.length) {
      setItemIdx(itemIdx + 1);
    } else if (groupIdx + 1 < groups.length) {
      setGroupIdx(groupIdx + 1);
      setItemIdx(0);
    } else {
      navigation.goBack();
    }
  };

  const goPrev = () => {
    if (itemIdx > 0) {
      setItemIdx(itemIdx - 1);
    } else if (groupIdx > 0) {
      const prevGroup = groups[groupIdx - 1];
      setGroupIdx(groupIdx - 1);
      setItemIdx(Math.max(0, prevGroup.items.length - 1));
    } else {
      navigation.goBack();
    }
  };

  const run = (from: number) => {
    progress.setValue(from);
    Animated.timing(progress, {
      toValue: 1,
      duration: durationMs * (1 - from),
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) goNext();
    });
  };

  useEffect(() => {
    if (!item) return;
    markStorySeen(item.id);
    run(0);
    return () => progress.stopAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIdx, itemIdx]);

  if (!group || !item) {
    // No visible stories (e.g. deep link after content changed) — leave.
    navigation.goBack();
    return null;
  }

  const onPressIn = () => {
    pressedAt.current = Date.now();
    progress.stopAnimation();
  };

  const onPressOut = (zone: 'prev' | 'next') => {
    const held = Date.now() - pressedAt.current;
    if (held < TAP_MS) {
      zone === 'next' ? goNext() : goPrev();
    } else {
      // long hold = pause; resume from where it stopped
      progress.stopAnimation((v) => run(typeof v === 'number' ? v : 0));
    }
  };

  return (
    <View style={styles.bg}>
      {/* Background media */}
      {mediaUrl(item.imageMedia, item.imageUrl) ? (
        <Image source={{ uri: mediaUrl(item.imageMedia, item.imageUrl) }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={[ch?.avatarColor ?? '#2E6B62', '#0A0D12']}
          style={StyleSheet.absoluteFill}
        />
      )}
      {/* Legibility scrims */}
      <LinearGradient
        colors={['rgba(0,0,0,0.55)', 'transparent']}
        style={styles.scrimTop}
        pointerEvents="none"
      />
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.55)']}
        style={styles.scrimBottom}
        pointerEvents="none"
      />

      {/* Tap zones (under the header so X stays clickable) */}
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.zones}>
          <Pressable style={styles.zonePrev} onPressIn={onPressIn} onPressOut={() => onPressOut('prev')} />
          <Pressable style={styles.zoneNext} onPressIn={onPressIn} onPressOut={() => onPressOut('next')} />
        </View>
      </View>

      {/* Progress segments */}
      <View style={styles.progressRow} pointerEvents="none">
        {group.items.map((it, i) => (
          <View key={it.id} style={styles.segment}>
            {i < itemIdx ? (
              <View style={[styles.segmentFill, { width: '100%' }]} />
            ) : i === itemIdx ? (
              <Animated.View
                style={[
                  styles.segmentFill,
                  {
                    width: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            ) : null}
          </View>
        ))}
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Avatar initials={ch?.initials ?? '?'} color={ch?.avatarColor} url={ch?.avatarUrl} size={34} />
        <Text style={styles.author}>{ch?.name ?? item.author}</Text>
        <Text style={styles.date}>{item.date}</Text>
        <View style={{ flex: 1 }} />
        <Pressable onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="close" size={26} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Overlay text */}
      {item.text ? (
        <View style={styles.textWrap} pointerEvents="none">
          <Text style={[styles.text, !item.imageUrl && styles.textBig]}>{item.text}</Text>
        </View>
      ) : null}

      {/* Fake reply bar, story-style */}
      <View style={styles.replyRow} pointerEvents="none">
        <View style={styles.replyField}>
          <Text style={styles.replyPlaceholder}>Enviar mensagem…</Text>
        </View>
        <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
        <Ionicons name="paper-plane-outline" size={22} color="#FFFFFF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  scrimTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 130 },
  scrimBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 140 },

  zones: { flex: 1, flexDirection: 'row' },
  zonePrev: { flex: 3 },
  zoneNext: { flex: 7 },

  progressRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    gap: 4,
  },
  segment: {
    flex: 1,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  segmentFill: { height: '100%', backgroundColor: '#FFFFFF', borderRadius: 2 },

  header: {
    position: 'absolute',
    top: 22,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  author: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  date: { color: 'rgba(255,255,255,0.75)', fontSize: 12 },

  textWrap: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 25,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 8,
  },
  textBig: { fontSize: 24, lineHeight: 34, fontWeight: '700' },

  replyRow: {
    position: 'absolute',
    bottom: 16,
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  replyField: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  replyPlaceholder: { color: 'rgba(255,255,255,0.7)', fontSize: 13.5 },
});
