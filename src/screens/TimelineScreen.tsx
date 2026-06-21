import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useGameStore } from '@/store/gameStore';
import { stamp } from '@/utils/format';
import type { Screen } from '@/navigation/types';

export function TimelineScreen({ navigation }: Screen<'Timeline'>) {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const events = [...state.timeline].sort((a, b) => a.at - b.at);

  return (
    <View style={styles.bg}>
      <ScreenHeader title="Linha do Tempo"
        icon="time"
        tint="#5E35B1" onBack={() => navigation.navigate('Home')} />
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        ListEmptyComponent={<Text style={styles.empty}>A investigação ainda não começou.</Text>}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <View style={styles.rail}>
              <View style={styles.dot} />
              {index < events.length - 1 ? <View style={styles.line} /> : null}
            </View>
            <View style={styles.card}>
              <Text style={styles.time}>{stamp(item.at)}</Text>
              <Text style={styles.title}>{item.title}</Text>
              {item.detail ? <Text style={styles.detail}>{item.detail}</Text> : null}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  empty: { color: theme.colors.textFaint, textAlign: 'center', marginTop: 48 },
  row: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: theme.colors.accent, marginTop: 6 },
  line: { flex: 1, width: 2, backgroundColor: theme.colors.border, marginTop: 2 },
  card: { flex: 1, paddingBottom: 22 },
  time: { color: theme.colors.textFaint, fontSize: 11 },
  title: { color: theme.colors.text, fontSize: 15.5, fontWeight: '700', marginTop: 2 },
  detail: { color: theme.colors.textDim, fontSize: 13.5, lineHeight: 19, marginTop: 4 },
});
