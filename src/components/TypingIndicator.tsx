import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

type Kind = 'typing' | 'audio' | 'video';

/**
 * Incoming "bubble" that shows a contact is busy: three pulsing dots for
 * "digitando…", or a red mic/camera glyph + dots for "gravando áudio/vídeo…".
 */
export function TypingIndicator({ kind = 'typing' }: { kind?: Kind }) {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const loops = dots.map((d, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(d, { toValue: 1, duration: 320, easing: Easing.ease, useNativeDriver: true }),
          Animated.timing(d, { toValue: 0.3, duration: 320, easing: Easing.ease, useNativeDriver: true }),
        ]),
      ),
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recording = kind === 'audio' || kind === 'video';

  return (
    <View style={styles.row}>
      <View style={styles.bubble}>
        {recording ? (
          <Ionicons
            name={kind === 'audio' ? 'mic' : 'videocam'}
            size={15}
            color={theme.colors.danger}
            style={styles.recIcon}
          />
        ) : null}
        {dots.map((d, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, marginVertical: 3, flexDirection: 'row', justifyContent: 'flex-start' },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: theme.colors.bubbleIn,
    borderRadius: theme.radius.md,
    borderTopLeftRadius: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  recIcon: { marginRight: 3 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.colors.textDim },
});
