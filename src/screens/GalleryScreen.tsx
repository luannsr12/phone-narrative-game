import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EVIDENCE_ICON } from '@/components/EvidenceCard';
import { useGameStore } from '@/store/gameStore';
import { story } from '@/story';
import type { Screen } from '@/navigation/types';

const VISUAL_KINDS = new Set(['photo', 'screenshot', 'video', 'location']);

export function GalleryScreen({ navigation }: Screen<'Gallery'>) {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const media = state.evidence
    .map((i) => ({ instance: i, ev: story.evidence[i.id] }))
    .filter((m) => m.ev && VISUAL_KINDS.has(m.ev.kind))
    .sort((a, b) => b.instance.receivedAt - a.instance.receivedAt);

  return (
    <View style={styles.bg}>
      <ScreenHeader title="Galeria"
        icon="images"
        tint="#7B1FA2" onBack={() => navigation.navigate('Home')} />
      <FlatList
        data={media}
        numColumns={3}
        keyExtractor={(m) => m.instance.id}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma imagem recebida.</Text>}
        contentContainerStyle={{ padding: 4 }}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.cell, { backgroundColor: item.ev!.thumbnailColor ?? theme.colors.surfaceHigh }]}
            onPress={() => navigation.navigate('FileDetail', { evidenceId: item.instance.id })}
          >
            <Ionicons name={EVIDENCE_ICON[item.ev!.kind]} size={26} color="#C9D2DF" />
            <Text style={styles.caption} numberOfLines={1}>
              {item.ev!.title}
            </Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  empty: { color: theme.colors.textFaint, textAlign: 'center', marginTop: 48 },
  cell: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: 4,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  caption: { color: theme.colors.text, fontSize: 10, marginTop: 6, textAlign: 'center', opacity: 0.85 },
});
