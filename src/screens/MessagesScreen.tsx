import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Avatar } from '@/components/Avatar';
import { useGameStore, selectPendingChoiceThread } from '@/store/gameStore';
import { charAvatar, displayName, getCharacter, isUnknown } from '@/utils/people';
import { clock } from '@/utils/format';
import type { Screen } from '@/navigation/types';

export function MessagesScreen({ navigation }: Screen<'Messages'>) {
  const state = useGameStore((s) => s.state);
  const pendingThread = useGameStore((s) => selectPendingChoiceThread(s.state));
  if (!state) return null;

  const threads = Object.entries(state.threads)
    .map(([id, t]) => ({ id, ...t }))
    .sort((a, b) => b.lastActivity - a.lastActivity);

  return (
    <View style={styles.bg}>
      <ScreenHeader
        title="Mensagens"
        icon="chatbubble-ellipses"
        tint="#2E7D6B"
        onBack={() => navigation.navigate('Home')}
        right={
          <View style={styles.headerRight}>
            <Ionicons name="search" size={18} color={theme.colors.textDim} />
            <Pressable onPress={() => navigation.navigate('Profile')} hitSlop={8}>
              <Avatar
                initials={state.playerName.trim().charAt(0).toUpperCase() || '?'}
                color={theme.colors.accentDim}
                size={28}
              />
            </Pressable>
          </View>
        }
      />
      <FlatList
        data={threads}
        keyExtractor={(t) => t.id}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma conversa ainda.</Text>}
        renderItem={({ item }) => {
          const last = item.entries[item.entries.length - 1];
          const unknown = isUnknown(state, item.id);
          const ch = getCharacter(item.id);
          const awaitingReply = pendingThread === item.id;
          const preview = awaitingReply
            ? 'aguardando sua resposta…'
            : !last
            ? 'Toque para enviar uma mensagem'
            : last.kind === 'player'
            ? `✓✓ ${last.text ?? ''}`
            : last.attachment
            ? last.attachment.kind === 'contact'
              ? 'Cartão de contato'
              : 'Anexo'
            : last.text ?? '';
          return (
            <Pressable
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              onPress={() => navigation.navigate('Chat', { threadId: item.id })}
            >
              <Avatar
                initials={ch?.initials ?? '?'}
                color={ch?.avatarColor}
                unknown={unknown}
                url={charAvatar(ch)}
              />
              <View style={styles.body}>
                <View style={styles.line}>
                  <Text style={[styles.name, item.unread > 0 && styles.unreadName]} numberOfLines={1}>
                    {displayName(state, item.id)}
                  </Text>
                  {last ? <Text style={styles.time}>{clock(item.lastActivity)}</Text> : null}
                </View>
                <View style={styles.line}>
                  <Text
                    style={[styles.preview, awaitingReply && styles.awaiting]}
                    numberOfLines={1}
                  >
                    {preview}
                  </Text>
                  {item.unread > 0 ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{item.unread}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
      {/* New-chat FAB: opens the agenda picker to start a conversation. */}
      <Pressable
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={() => navigation.navigate('NewChat')}
      >
        <Ionicons name="chatbox-ellipses" size={22} color="#E7ECF3" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingRight: 8 },
  empty: { color: theme.colors.textFaint, textAlign: 'center', marginTop: 48 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  pressed: { backgroundColor: theme.colors.surface },
  body: { flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border, paddingBottom: 12 },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '600', flex: 1 },
  unreadName: { fontWeight: '800' },
  time: { color: theme.colors.textFaint, fontSize: 12, marginLeft: 8 },
  preview: { color: theme.colors.textDim, fontSize: 13.5, flex: 1, marginTop: 3 },
  awaiting: { color: theme.colors.accent, fontStyle: 'italic' },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: theme.colors.unread,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  badgeText: { color: '#06231F', fontSize: 12, fontWeight: '800' },
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 20,
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: theme.colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  fabPressed: { opacity: 0.85, transform: [{ scale: 0.96 }] },
});
