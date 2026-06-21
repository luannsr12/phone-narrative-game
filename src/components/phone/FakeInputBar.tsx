import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

interface Props {
  /** When the story is waiting on a reply: tapping the bar opens the options. */
  onPress?: () => void;
  /** Replaces the "Mensagem" placeholder (e.g. "Toque para responder…"). */
  hint?: string;
}

/**
 * A messenger input row. Normally purely visual (the player never free-types),
 * but while a choice is pending it becomes the tap target that opens the
 * authored reply options — like tapping a real input opens the keyboard.
 */
export function FakeInputBar({ onPress, hint }: Props) {
  const active = Boolean(onPress);
  return (
    <Pressable style={styles.row} onPress={onPress} disabled={!active}>
      <View style={[styles.field, active && styles.fieldActive]}>
        <Ionicons name="happy-outline" size={20} color={theme.colors.textFaint} />
        <Text style={[styles.placeholder, active && styles.placeholderActive]}>
          {hint ?? 'Mensagem'}
        </Text>
        <Ionicons name="attach" size={19} color={theme.colors.textFaint} style={styles.attach} />
        <Ionicons name="camera-outline" size={19} color={theme.colors.textFaint} />
      </View>
      <View style={[styles.mic, active && styles.micActive]}>
        <Ionicons name={active ? 'chatbox-ellipses' : 'mic'} size={19} color="#E7ECF3" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 7,
    backgroundColor: '#0A0D12',
  },
  field: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  placeholder: { flex: 1, color: theme.colors.textFaint, fontSize: 15 },
  placeholderActive: { color: theme.colors.accent },
  fieldActive: {
    borderWidth: 1,
    borderColor: 'rgba(46,107,98,0.55)',
  },
  attach: { transform: [{ rotate: '45deg' }] },
  mic: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.accentDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micActive: { backgroundColor: theme.colors.accent },
});
