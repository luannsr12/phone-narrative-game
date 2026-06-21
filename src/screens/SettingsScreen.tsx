import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet, ScrollView } from 'react-native';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useGameStore } from '@/store/gameStore';
import { story } from '@/story';
import { resetTo } from '@/navigation/navigationRef';
import type { Screen } from '@/navigation/types';

export function SettingsScreen({ navigation }: Screen<'Settings'>) {
  const state = useGameStore((s) => s.state);
  const resetGame = useGameStore((s) => s.resetGame);
  if (!state) return null;

  const confirmReset = () => {
    Alert.alert(
      'Reiniciar investigação?',
      'Todo o progresso, as evidências e as escolhas serão apagados. Não há como desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar tudo',
          style: 'destructive',
          onPress: () => {
            resetGame();
            resetTo('Lock');
          },
        },
      ],
    );
  };

  return (
    <View style={styles.bg}>
      <ScreenHeader title="Ajustes"
        icon="settings"
        tint="#46535C" onBack={() => navigation.navigate('Home')} />
      <ScrollView contentContainerStyle={styles.content}>
        <Row label="Nome" value={state.playerName} />
        <Row label="Capítulos concluídos" value={`${state.completedChapters.length}`} />
        <Row label="Evidências coletadas" value={`${state.evidence.length}`} />
        <Row label="Contatos identificados" value={`${state.unlockedContacts.length}`} />
        <Row label="Escolhas feitas" value={`${state.choicesMade.length}`} />

        <Pressable style={styles.reset} onPress={confirmReset}>
          <Text style={styles.resetText}>Reiniciar investigação</Text>
        </Pressable>

        <Text style={styles.version}>
          {story.meta.title} · v{story.meta.version}
        </Text>
      </ScrollView>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 16 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowLabel: { color: theme.colors.textDim, fontSize: 15 },
  rowValue: { color: theme.colors.text, fontSize: 15, fontWeight: '600' },
  reset: {
    marginTop: 32,
    borderWidth: 1,
    borderColor: theme.colors.danger,
    borderRadius: theme.radius.pill,
    paddingVertical: 13,
    alignItems: 'center',
  },
  resetText: { color: theme.colors.danger, fontSize: 15, fontWeight: '700' },
  version: { color: theme.colors.textFaint, fontSize: 12, textAlign: 'center', marginTop: 24 },
});
