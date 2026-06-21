import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { Avatar } from '@/components/Avatar';
import { useGameStore } from '@/store/gameStore';
import { charAvatar, getCharacter, isUnknown, contactPhone } from '@/utils/people';
import type { Screen } from '@/navigation/types';

/**
 * Contact card. For unidentified numbers it behaves like a real messenger:
 * the number is the title, no personal info is revealed (identity stays
 * gated until the story unlocks the contact), and the usual
 * add/block/report affordances appear.
 */
export function ContactProfileScreen({ navigation, route }: Screen<'ContactProfile'>) {
  const { characterId } = route.params;
  const state = useGameStore((s) => s.state);
  const ch = getCharacter(characterId);
  if (!state || !ch) return null;

  const unknown = isUnknown(state, characterId);
  const hasThread = Boolean(state.threads[characterId]);
  const phone = contactPhone(characterId);

  return (
    <View style={styles.bg}>
      <ScreenHeader title={unknown ? 'Número' : 'Perfil'} icon="person" tint="#C77800" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.head}>
          <Avatar
            initials={ch.initials}
            color={ch.avatarColor}
            unknown={unknown}
            url={charAvatar(ch)}
            size={88}
          />
          <Text style={styles.name}>{unknown ? phone : ch.fullName}</Text>
          <Text style={styles.role}>
            {unknown
              ? 'não está nos seus contatos'
              : `${ch.role}${ch.age ? ` · ${ch.age} anos` : ''}`}
          </Text>
        </View>

        {/* Contact action row, like a real contacts app. */}
        <View style={styles.actions}>
          <Pressable
            style={styles.action}
            onPress={() => hasThread && navigation.navigate('Chat', { threadId: characterId })}
          >
            <View style={[styles.actionCircle, !hasThread && styles.actionDisabled]}>
              <Ionicons name="chatbubble" size={19} color="#E7ECF3" />
            </View>
            <Text style={styles.actionLabel}>Mensagem</Text>
          </Pressable>
          <View style={styles.action}>
            <View style={[styles.actionCircle, styles.actionDisabled]}>
              <Ionicons name="call" size={19} color="#E7ECF3" />
            </View>
            <Text style={styles.actionLabel}>Ligar</Text>
          </View>
          <View style={styles.action}>
            <View style={[styles.actionCircle, styles.actionDisabled]}>
              <Ionicons name="videocam" size={19} color="#E7ECF3" />
            </View>
            <Text style={styles.actionLabel}>Vídeo</Text>
          </View>
        </View>

        {unknown ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Sobre</Text>
            <Text style={styles.cardText}>
              Sem informações. Este número não está na sua agenda.
            </Text>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Sobre</Text>
            <Text style={styles.cardText}>{ch.bio}</Text>
          </View>
        )}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Número</Text>
          <View style={styles.numberRow}>
            <Ionicons name="call-outline" size={16} color={theme.colors.textDim} />
            <Text style={styles.cardText}>{phone}</Text>
            <Text style={styles.numberHint}>celular</Text>
          </View>
        </View>

        {unknown ? (
          <View style={styles.dangerCard}>
            <View style={styles.dangerRow}>
              <Ionicons name="person-add-outline" size={17} color={theme.colors.accent} />
              <Text style={styles.addText}>Adicionar aos contatos</Text>
            </View>
            <View style={styles.dangerDivider} />
            <View style={styles.dangerRow}>
              <Ionicons name="ban-outline" size={17} color={theme.colors.danger} />
              <Text style={styles.dangerText}>Bloquear {phone}</Text>
            </View>
            <View style={styles.dangerDivider} />
            <View style={styles.dangerRow}>
              <Ionicons name="thumbs-down-outline" size={17} color={theme.colors.danger} />
              <Text style={styles.dangerText}>Denunciar contato</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 20 },
  head: { alignItems: 'center', marginBottom: 20 },
  name: { color: theme.colors.text, fontSize: 22, fontWeight: '800', marginTop: 14, textAlign: 'center' },
  role: { color: theme.colors.textDim, fontSize: 14, marginTop: 4 },

  actions: { flexDirection: 'row', justifyContent: 'space-evenly', marginBottom: 22 },
  action: { alignItems: 'center', gap: 6 },
  actionCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionDisabled: { backgroundColor: theme.colors.surfaceHigh },
  actionLabel: { color: theme.colors.textDim, fontSize: 12 },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  cardLabel: { color: theme.colors.accent, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  cardText: { color: theme.colors.text, fontSize: 15, lineHeight: 22 },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numberHint: { color: theme.colors.textFaint, fontSize: 12, marginLeft: 'auto' },

  dangerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    paddingHorizontal: 16,
  },
  dangerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  dangerDivider: { height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border },
  addText: { color: theme.colors.accent, fontSize: 14.5 },
  dangerText: { color: theme.colors.danger, fontSize: 14.5 },
});
