import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Avatar } from '@/components/Avatar';
import { useGameStore } from '@/store/gameStore';
import { charAvatar, displayName, getCharacter, contactPhone, findContactByNumber } from '@/utils/people';
import { stamp, duration } from '@/utils/format';
import type { CallRecord } from '@/types/game';
import type { Screen } from '@/navigation/types';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** How an outgoing call record reads in the Recentes list. */
function outMeta(r: CallRecord): { icon: IconName; color: string; label: string } {
  switch (r.status) {
    case 'answered':
      return { icon: 'phone-outgoing', color: theme.colors.textDim, label: `Chamada · ${duration(r.durationSec ?? 0)}` };
    case 'declined':
      return { icon: 'phone-cancel', color: theme.colors.warning, label: 'Recusada' };
    case 'missed':
      return { icon: 'phone-outgoing', color: theme.colors.warning, label: 'Não atendida' };
    default:
      return { icon: 'phone-outgoing', color: theme.colors.textDim, label: 'Chamada realizada' };
  }
}

type Tab = 'recentes' | 'contatos' | 'teclado';

/** Telefone — the phone app: recent calls, the agenda, and a working dialer. */
export function CallsScreen({ navigation }: Screen<'Calls'>) {
  const state = useGameStore((s) => s.state);
  const [tab, setTab] = useState<Tab>('recentes');
  if (!state) return null;

  const call = (number: string, contact?: string) =>
    navigation.navigate('Dialing', { number, contact });

  return (
    <View style={styles.bg}>
      <ScreenHeader title="Telefone" icon="call" tint="#1976A8" onBack={() => navigation.navigate('Home')} />

      <View style={styles.body}>
        {tab === 'recentes' && <RecentsTab state={state} onCall={call} />}
        {tab === 'contatos' && <ContactsTab state={state} onCall={call} />}
        {tab === 'teclado' && <DialerTab state={state} onCall={call} />}
      </View>

      <View style={styles.tabBar}>
        <TabButton icon="time-outline" label="Recentes" active={tab === 'recentes'} onPress={() => setTab('recentes')} />
        <TabButton icon="people-outline" label="Contatos" active={tab === 'contatos'} onPress={() => setTab('contatos')} />
        <TabButton icon="keypad-outline" label="Teclado" active={tab === 'teclado'} onPress={() => setTab('teclado')} />
      </View>
    </View>
  );
}

function TabButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const color = active ? theme.colors.accent : theme.colors.textFaint;
  return (
    <Pressable style={styles.tab} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </Pressable>
  );
}

/**
 * Recent calls, newest first: the player's OUTGOING calls (from `calls`) merged
 * with INCOMING missed calls (the call-log entries the story files into threads).
 */
type CallRow =
  | { id: string; dir: 'in'; speaker: string; at: number }
  | { id: string; dir: 'out'; record: CallRecord };

function RecentsTab({
  state,
  onCall,
}: {
  state: NonNullable<ReturnType<typeof useGameStore.getState>['state']>;
  onCall: (number: string, contact?: string) => void;
}) {
  const rows = useMemo<CallRow[]>(() => {
    const incoming: CallRow[] = Object.values(state.threads)
      .flatMap((t) => t.entries)
      .filter((e) => e.kind === 'call-log')
      .map((e) => ({ id: e.id, dir: 'in', speaker: e.speaker, at: e.at }));
    const outgoing: CallRow[] = state.calls.map((r) => ({ id: r.id, dir: 'out', record: r }));
    return [...incoming, ...outgoing].sort(
      (a, b) => (b.dir === 'in' ? b.at : b.record.at) - (a.dir === 'in' ? a.at : a.record.at),
    );
  }, [state.threads, state.calls]);

  return (
    <FlatList
      data={rows}
      keyExtractor={(r) => r.id}
      ListEmptyComponent={<Text style={styles.empty}>Nenhuma chamada registrada.</Text>}
      renderItem={({ item }) => {
        if (item.dir === 'in') {
          const ch = getCharacter(item.speaker);
          return (
            <View style={styles.row}>
              <Avatar initials={ch?.initials ?? '?'} color={ch?.avatarColor} url={charAvatar(ch)} size={40} />
              <View style={styles.body2}>
                <Text style={styles.name}>{displayName(state, item.speaker)}</Text>
                <View style={styles.subRow}>
                  <MaterialCommunityIcons name="phone-missed" size={13} color={theme.colors.warning} />
                  <Text style={[styles.sub, { color: theme.colors.warning }]}>Chamada perdida · {stamp(item.at)}</Text>
                </View>
              </View>
              <Pressable hitSlop={10} onPress={() => onCall(contactPhone(item.speaker), item.speaker)}>
                <Ionicons name="call" size={20} color={theme.colors.accent} />
              </Pressable>
            </View>
          );
        }
        const r = item.record;
        const ch = r.contact ? getCharacter(r.contact) : undefined;
        const name = r.contact ? displayName(state, r.contact) : r.target;
        const meta = outMeta(r);
        return (
          <View style={styles.row}>
            <Avatar initials={ch?.initials ?? '?'} color={ch?.avatarColor} url={charAvatar(ch)} size={40} />
            <View style={styles.body2}>
              <Text style={styles.name}>{name}</Text>
              <View style={styles.subRow}>
                <MaterialCommunityIcons name={meta.icon} size={13} color={meta.color} />
                <Text style={[styles.sub, { color: meta.color }]}>{meta.label} · {stamp(r.at)}</Text>
              </View>
            </View>
            <Pressable hitSlop={10} onPress={() => onCall(r.contact ? contactPhone(r.contact) : r.target, r.contact)}>
              <Ionicons name="call" size={20} color={theme.colors.accent} />
            </Pressable>
          </View>
        );
      }}
    />
  );
}

/** The agenda — every saved (unlocked) contact, tap-to-call. */
function ContactsTab({
  state,
  onCall,
}: {
  state: NonNullable<ReturnType<typeof useGameStore.getState>['state']>;
  onCall: (number: string, contact?: string) => void;
}) {
  const contacts = useMemo(
    () =>
      state.unlockedContacts
        .map((id) => getCharacter(id))
        .filter((c): c is NonNullable<typeof c> => Boolean(c))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [state.unlockedContacts],
  );

  return (
    <FlatList
      data={contacts}
      keyExtractor={(c) => c.id}
      ListEmptyComponent={<Text style={styles.empty}>Nenhum contato na agenda.</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => onCall(contactPhone(item.id), item.id)}>
          <Avatar initials={item.initials} color={item.avatarColor} url={charAvatar(item)} size={40} />
          <View style={styles.body2}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.phone}>{contactPhone(item.id)}</Text>
          </View>
          <Ionicons name="call" size={20} color={theme.colors.accent} />
        </Pressable>
      )}
    />
  );
}

const KEYS = [
  ['1', ''],
  ['2', 'ABC'],
  ['3', 'DEF'],
  ['4', 'GHI'],
  ['5', 'JKL'],
  ['6', 'MNO'],
  ['7', 'PQRS'],
  ['8', 'TUV'],
  ['9', 'WXYZ'],
  ['*', ''],
  ['0', '+'],
  ['#', ''],
];

/** The keypad: type a number, see the matching contact, place a (fake) call. */
function DialerTab({
  state,
  onCall,
}: {
  state: NonNullable<ReturnType<typeof useGameStore.getState>['state']>;
  onCall: (number: string, contact?: string) => void;
}) {
  const [number, setNumber] = useState('');
  const match = findContactByNumber(state, number);

  const press = (k: string) => setNumber((n) => (n.length < 20 ? n + k : n));
  const back = () => setNumber((n) => n.slice(0, -1));
  const placeCall = () => {
    if (!number) return;
    onCall(number, match?.id);
  };

  return (
    <ScrollView contentContainerStyle={styles.dialer} keyboardShouldPersistTaps="handled">
      <View style={styles.display}>
        {match ? <Text style={styles.matchName}>{match.name}</Text> : null}
        <Text style={styles.number} numberOfLines={1} adjustsFontSizeToFit>
          {number || ' '}
        </Text>
        {!match && number.length >= 4 ? (
          <Text style={styles.unknownHint}>número não salvo</Text>
        ) : null}
      </View>

      <View style={styles.keypad}>
        {KEYS.map(([k, sub]) => (
          <Pressable key={k} style={styles.key} onPress={() => press(k)} android_ripple={{ color: 'rgba(255,255,255,0.12)', radius: 38, borderless: true }}>
            <Text style={styles.keyDigit}>{k}</Text>
            {sub ? <Text style={styles.keySub}>{sub}</Text> : null}
          </Pressable>
        ))}
      </View>

      <View style={styles.callRow}>
        <View style={styles.callSpacer} />
        <Pressable style={[styles.callBtn, !number && styles.callBtnOff]} onPress={placeCall} disabled={!number}>
          <Ionicons name="call" size={28} color="#fff" />
        </Pressable>
        <View style={styles.callSpacer}>
          {number ? (
            <Pressable hitSlop={12} onPress={back} onLongPress={() => setNumber('')}>
              <Ionicons name="backspace-outline" size={26} color={theme.colors.textDim} />
            </Pressable>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  body: { flex: 1 },
  empty: { color: theme.colors.textFaint, textAlign: 'center', marginTop: 48 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  body2: { flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border, paddingBottom: 12 },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '600' },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  sub: { color: theme.colors.warning, fontSize: 12.5 },
  phone: { color: theme.colors.textDim, fontSize: 12.5, marginTop: 3 },

  // Bottom tab bar
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  tabLabel: { fontSize: 11, fontWeight: '600' },

  // Dialer
  dialer: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 24, paddingBottom: 18 },
  display: { alignItems: 'center', minHeight: 96, justifyContent: 'center', marginBottom: 10 },
  matchName: { color: theme.colors.accent, fontSize: 15, fontWeight: '600', marginBottom: 4 },
  number: { color: theme.colors.text, fontSize: 34, fontWeight: '300', letterSpacing: 1, textAlign: 'center' },
  unknownHint: { color: theme.colors.textFaint, fontSize: 12, marginTop: 4 },

  keypad: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 6 },
  key: { width: '33.33%', height: 64, alignItems: 'center', justifyContent: 'center' },
  keyDigit: { color: theme.colors.text, fontSize: 28, fontWeight: '400' },
  keySub: { color: theme.colors.textFaint, fontSize: 9, letterSpacing: 1.5, marginTop: -2 },

  callRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  callSpacer: { flex: 1, alignItems: 'center' },
  callBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2E7D4F',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  callBtnOff: { backgroundColor: 'rgba(46,125,79,0.4)' },
});
