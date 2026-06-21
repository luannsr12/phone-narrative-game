import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';

import { Entrance } from '@/components/phone/Entrance';
import { theme } from '@/theme';
import { useGameStore } from '@/store/gameStore';
import { story } from '@/story';
import { resetTo } from '@/navigation/navigationRef';
import { interpolate } from '@/utils/template';

/** Terminal ending sequence — scenes reveal one at a time, then offer restart. */
export function EndingOverlay() {
  const endingId = useGameStore((s) => s.state?.endingId ?? null);
  const playerName = useGameStore((s) => s.state?.playerName ?? '');
  const gender = useGameStore((s) => s.state?.playerGender);
  const resetGame = useGameStore((s) => s.resetGame);
  const [revealed, setRevealed] = useState(1);

  const raw = endingId ? story.endings[endingId] : undefined;
  const ending = raw
    ? { ...raw, scenes: raw.scenes.map((s) => interpolate(s, { playerName, gender })) }
    : undefined;

  useEffect(() => {
    setRevealed(1);
  }, [endingId]);

  useEffect(() => {
    if (!ending) return;
    if (revealed >= ending.scenes.length) return;
    const t = setTimeout(() => setRevealed((r) => r + 1), 2600);
    return () => clearTimeout(t);
  }, [revealed, ending]);

  if (!ending) return null;
  const done = revealed >= ending.scenes.length;

  return (
    <Entrance from={0} style={styles.backdrop}>
      <View style={styles.safe}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.kicker}>{ending.tagline}</Text>
          <Text style={styles.title}>{ending.title}</Text>

          <View style={styles.scenes}>
            {ending.scenes.slice(0, revealed).map((s, i) => (
              <Text key={i} style={styles.scene}>
                {s}
              </Text>
            ))}
          </View>

          {done ? (
            <>
              <Text style={styles.summary}>{ending.summary}</Text>
              <Pressable
                style={styles.btn}
                onPress={() => {
                  resetGame();
                  resetTo('Lock');
                }}
              >
                <Text style={styles.btnText}>Recomeçar a investigação</Text>
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.skip} onPress={() => setRevealed(ending.scenes.length)}>
              <Text style={styles.skipText}>continuar ›</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </Entrance>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#04060A' },
  safe: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 28 },
  kicker: { color: theme.colors.danger, fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  title: { color: theme.colors.text, fontSize: 27, fontWeight: '800', marginTop: 8 },
  scenes: { marginTop: 24, gap: 18 },
  scene: { color: theme.colors.text, fontSize: 16.5, lineHeight: 26 },
  summary: { color: theme.colors.textDim, fontSize: 14, fontStyle: 'italic', lineHeight: 21, marginTop: 28 },
  btn: {
    marginTop: 28,
    borderWidth: 1,
    borderColor: theme.colors.accent,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: theme.colors.accent, fontSize: 15.5, fontWeight: '700' },
  skip: { marginTop: 28, alignSelf: 'flex-end' },
  skipText: { color: theme.colors.textFaint, fontSize: 14 },
});
