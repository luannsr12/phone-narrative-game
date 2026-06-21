import React from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Avatar } from '@/components/Avatar';
import { useGameStore } from '@/store/gameStore';
import { charAvatar, getCharacter } from '@/utils/people';
import type { Screen } from '@/navigation/types';

export function ContactsScreen({ navigation }: Screen<'Contacts'>) {
  const state = useGameStore((s) => s.state);
  if (!state) return null;

  const contacts = state.unlockedContacts
    .map((id) => getCharacter(id))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));

  return (
    <View style={styles.bg}>
      <ScreenHeader title="Contatos"
        icon="people"
        tint="#C77800" onBack={() => navigation.navigate('Home')} />
      <FlatList
        data={contacts}
        keyExtractor={(c) => c.id}
        ListHeaderComponent={
          <Pressable
            style={({ pressed }) => [styles.row, styles.meRow, pressed && styles.pressed]}
            onPress={() => navigation.navigate('Profile')}
          >
            <Avatar
              initials={state.playerName.trim().charAt(0).toUpperCase() || '?'}
              color={theme.colors.accentDim}
            />
            <View style={styles.body}>
              <Text style={styles.name}>{state.playerName} (você)</Text>
              <Text style={styles.role}>Meu perfil</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        }
        ListEmptyComponent={<Text style={styles.empty}>Você ainda não identificou ninguém.</Text>}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            onPress={() => navigation.navigate('ContactProfile', { characterId: item.id })}
          >
            <Avatar initials={item.initials} color={item.avatarColor} url={charAvatar(item)} />
            <View style={styles.body}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.role}>{item.role}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  empty: { color: theme.colors.textFaint, textAlign: 'center', marginTop: 48 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  meRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    marginBottom: 4,
  },
  pressed: { backgroundColor: theme.colors.surface },
  body: { flex: 1 },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  role: { color: theme.colors.textDim, fontSize: 13, marginTop: 2 },
  chev: { color: theme.colors.textFaint, fontSize: 24 },
});
