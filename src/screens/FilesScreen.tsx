import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EvidenceCard } from '@/components/EvidenceCard';
import { useGameStore } from '@/store/gameStore';
import { story } from '@/story';
import { displayName } from '@/utils/people';
import type { Screen } from '@/navigation/types';

export function FilesScreen({ navigation }: Screen<'Files'>) {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const items = [...state.evidence].sort((a, b) => b.receivedAt - a.receivedAt);

  return (
    <View style={styles.bg}>
      <ScreenHeader
        title="Arquivos do Caso"
        icon="folder"
        tint="#3F51A5"
        subtitle={`${items.length} evidência(s)`}
        onBack={() => navigation.navigate('Home')}
      />
      <FlatList
        data={items}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma evidência coletada ainda.</Text>}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => {
          const ev = story.evidence[item.id];
          if (!ev) return null;
          return (
            <EvidenceCard
              evidence={ev}
              receivedAt={item.receivedAt}
              fromName={item.from === 'system' ? 'Sistema' : displayName(state, item.from)}
              onPress={() => navigation.navigate('FileDetail', { evidenceId: item.id })}
            />
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  empty: { color: theme.colors.textFaint, textAlign: 'center', marginTop: 48 },
});
