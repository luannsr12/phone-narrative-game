import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { theme } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { story } from '@/story';

/**
 * Chapter-break modal. Shown only when another chapter follows — when authored
 * content runs out, no overlay appears at all: the phone just goes quiet, like
 * a story still in progress. Never reference development status in-game.
 *
 * Deliberately non-disruptive: it floats over whatever screen the player is on
 * and continuing does NOT navigate anywhere — the next chapter announces
 * itself the way everything else does (typing, notifications).
 */
export function ChapterCompleteOverlay() {
  const justCompleted = useGameStore((s) => s.state?.justCompletedChapter ?? null);
  const goToNextChapter = useGameStore((s) => s.goToNextChapter);
  const endingId = useGameStore((s) => s.state?.endingId ?? null);

  const anim = useRef(new Animated.Value(0)).current;
  const visible = Boolean(justCompleted && !endingId);

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, speed: 14, bounciness: 7, useNativeDriver: true }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, justCompleted]);

  if (!visible) return null;

  const chapter = story.chapters[justCompleted!];
  const idx = story.chapterOrder.indexOf(justCompleted!);
  const nextId = story.chapterOrder[idx + 1];
  const next = nextId ? story.chapters[nextId] : undefined;

  // Story paused until more chapters exist — stay diegetic, show nothing.
  if (!next) return null;

  // The player stays exactly where they are; the story resumes around them.
  const onContinue = () => goToNextChapter();

  const cardStyle = {
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [26, 0] }) },
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
    ],
  };

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onContinue} />
      <Animated.View style={[styles.cardWrap, cardStyle]} pointerEvents="box-none">
        {/* Gradient hairline border around the card */}
        <LinearGradient
          colors={['#2E7D6B', '#16323C', '#0E141D']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.border}
        >
          <View style={styles.card}>
            <LinearGradient colors={['#2E7D6B', '#174A40']} style={styles.iconBadge}>
              <Ionicons name="bookmark" size={20} color="#E7ECF3" />
            </LinearGradient>

            <Text style={styles.kicker}>CAPÍTULO CONCLUÍDO</Text>
            <Text style={styles.doneTitle} numberOfLines={2}>
              {chapter?.title ?? 'Capítulo'}
            </Text>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Ionicons name="chevron-down" size={13} color={theme.colors.textFaint} />
              <View style={styles.divider} />
            </View>

            <Text style={styles.nextKicker}>A SEGUIR</Text>
            <Text style={styles.nextTitle} numberOfLines={2}>
              {next.title}
            </Text>
            {next.objective ? (
              <Text style={styles.objective} numberOfLines={3}>
                {next.objective}
              </Text>
            ) : null}

            <Pressable style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]} onPress={onContinue}>
              <Text style={styles.btnText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={15} color="#E7ECF3" />
            </Pressable>
            <Text style={styles.hint}>você continua de onde parou</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4,6,10,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 26,
  },
  cardWrap: { width: '100%', maxWidth: 340 },
  border: { borderRadius: 22, padding: 1.5 },
  card: {
    backgroundColor: '#0C1118',
    borderRadius: 20.5,
    paddingVertical: 24,
    paddingHorizontal: 22,
    alignItems: 'center',
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  kicker: {
    color: theme.colors.accent,
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  doneTitle: {
    color: theme.colors.text,
    fontSize: 19,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 25,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'stretch',
    marginVertical: 16,
  },
  divider: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
  nextKicker: {
    color: theme.colors.textFaint,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2.4,
  },
  nextTitle: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 5,
  },
  objective: {
    color: theme.colors.textDim,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 7,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    alignSelf: 'stretch',
    marginTop: 20,
    backgroundColor: theme.colors.accentDim,
    borderRadius: theme.radius.pill,
    paddingVertical: 13,
  },
  btnPressed: { opacity: 0.85 },
  btnText: { color: '#E7ECF3', fontSize: 15, fontWeight: '700' },
  hint: { color: theme.colors.textFaint, fontSize: 11, marginTop: 10 },
});
