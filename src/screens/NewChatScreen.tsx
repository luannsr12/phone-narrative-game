import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Avatar } from '@/components/Avatar';
import { useGameStore, selectPendingChoiceThread } from '@/store/gameStore';
import { charAvatar, getCharacter, presence, lastCharacterActivity } from '@/utils/people';
import type { Screen } from '@/navigation/types';

/**
 * Messenger-style "new conversation" picker: the agenda contacts, reachable
 * from the Messages FAB. Tapping one opens (or creates the view of) their
 * chat — whether the player can actually SAY anything there is up to the
 * story (a pending choice / liberated thread), like everything else.
 */
export function NewChatScreen({ navigation }: Screen<'NewChat'>) {
  const state = useGameStore((s) => s.state);
  const pendingThread = useGameStore((s) => selectPendingChoiceThread(s.state));
  if (!state) return null;

  const contacts = state.unlockedContacts
    .map((id) => getCharacter(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <View style={styles.bg}>
      <ScreenHeader
        title="Nova conversa"
        icon="chatbubble-ellipses"
        tint="#2E7D6B"
        onBack={() => navigation.goBack()}
      />
      <FlatList
        data={contacts}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <Text style={styles.section}>
            {contacts.length} contato{contacts.length === 1 ? '' : 's'} na agenda
          </Text>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Nenhum contato salvo na agenda ainda.</Text>
        }
        renderItem={({ item }) => {
          const awaiting = pendingThread === item.id;
          const online = presence(
            item.id,
            Date.now(),
            lastCharacterActivity(state, item.id),
            state.presence?.[item.id],
          ).online;
          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              // replace: back from the chat returns to the Messages list, not here.
              onPress={() => navigation.replace('Chat', { threadId: item.id })}
            >
              <View>
                <Avatar initials={item.initials} color={item.avatarColor} url={charAvatar(item)} />
                {online ? <View style={styles.onlineDot} /> : null}
              </View>
              <View style={styles.body}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={[styles.role, awaiting && styles.awaiting]} numberOfLines={1}>
                  {awaiting ? 'aguardando sua resposta…' : item.role}
                </Text>
              </View>
              <Ionicons name="chatbubble-outline" size={18} color={theme.colors.textFaint} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  section: {
    color: theme.colors.textFaint,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    textTransform: 'uppercase',
  },
  empty: { color: theme.colors.textFaint, textAlign: 'center', marginTop: 48 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11 },
  pressed: { backgroundColor: theme.colors.surface },
  body: { flex: 1 },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  role: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  awaiting: { color: theme.colors.accent, fontStyle: 'italic' },
  onlineDot: {
    position: 'absolute',
    right: -1,
    bottom: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF7D',
    borderWidth: 2,
    borderColor: theme.colors.bg,
  },
});
