import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import type { Gender } from '@/types/game';
import type { Screen } from '@/navigation/types';

const CARRIER = 'Maravox';

const GENDERS: { value: Gender; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { value: 'm', label: 'Masculino', icon: 'male' },
  { value: 'f', label: 'Feminino', icon: 'female' },
];

/**
 * Line activation, framed as the carrier's setup screen. The player gives the
 * first name everyone in the story will call them by (we keep just the first
 * word so they can't register a full name) and their gender — both required,
 * since gender is fixed for the run and drives gendered lines/branches.
 */
export function NameScreen({ navigation }: Screen<'Name'>) {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);

  // Lock the field to a single first name: once a space is typed, anything
  // after it is dropped (also collapses a pasted "First Last" to "First").
  const onChange = (text: string) => setName(text.replace(/^\s+/, '').split(/\s/)[0]);

  const ready = Boolean(name.trim()) && gender !== null;

  const begin = () => {
    const trimmed = name.trim();
    if (!trimmed || gender === null) return;
    // Activation done — next step is restoring the contact backup. The game
    // only actually starts there (so the first message arrives once the
    // restored contacts already exist in the agenda).
    navigation.navigate('Restore', { name: trimmed, gender });
  };

  return (
    <View style={styles.bg}>
      <View style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.inner}
        >
          <View style={styles.brand}>
            <View style={styles.simBadge}>
              <MaterialCommunityIcons name="sim" size={22} color={theme.colors.accent} />
            </View>
            <Text style={styles.carrier}>{CARRIER}</Text>
            <Text style={styles.brandSub}>Ativação de linha</Text>
          </View>

          <Text style={styles.q}>Para ativar sua linha, informe seu nome por favor.</Text>

          <TextInput
            value={name}
            onChangeText={onChange}
            placeholder="primeiro nome"
            placeholderTextColor={theme.colors.textFaint}
            style={styles.input}
            autoFocus
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={20}
            returnKeyType="next"
            onSubmitEditing={begin}
          />

          <Text style={styles.genderLabel}>Gênero</Text>
          <View style={styles.genderRow}>
            {GENDERS.map((g) => {
              const active = gender === g.value;
              return (
                <Pressable
                  key={g.value}
                  style={[styles.genderBtn, active && styles.genderBtnActive]}
                  onPress={() => setGender(g.value)}
                >
                  <Ionicons
                    name={g.icon}
                    size={18}
                    color={active ? theme.colors.accent : theme.colors.textDim}
                  />
                  <Text style={[styles.genderText, active && styles.genderTextActive]}>
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            style={[styles.btn, !ready && styles.btnDisabled]}
            onPress={begin}
            disabled={!ready}
          >
            <Text style={styles.btnText}>Ativar linha</Text>
          </Pressable>

          <Text style={styles.note}>Usaremos apenas o seu primeiro nome.</Text>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#05070A' },
  safe: { flex: 1 },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 28 },
  brand: { alignItems: 'center', marginBottom: 36 },
  simBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(46,125,107,0.14)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  carrier: { color: theme.colors.text, fontSize: 20, fontWeight: '800', letterSpacing: 0.5 },
  brandSub: { color: theme.colors.textDim, fontSize: 13, marginTop: 3 },
  q: { color: theme.colors.text, fontSize: 19, fontWeight: '600', lineHeight: 26, textAlign: 'center' },
  input: {
    marginTop: 26,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.accent,
    color: theme.colors.text,
    fontSize: 22,
    paddingVertical: 10,
    textAlign: 'center',
  },
  genderLabel: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginTop: 30,
    marginBottom: 12,
    textAlign: 'center',
  },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  genderBtnActive: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(46,125,107,0.14)',
  },
  genderText: { color: theme.colors.textDim, fontSize: 15, fontWeight: '600' },
  genderTextActive: { color: theme.colors.text },
  btn: {
    marginTop: 32,
    backgroundColor: theme.colors.accentDim,
    borderRadius: theme.radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  note: { color: theme.colors.textFaint, fontSize: 13, marginTop: 24, textAlign: 'center' },
});
