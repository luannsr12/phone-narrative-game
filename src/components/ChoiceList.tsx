import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import type { ChoiceOption } from '@/types/story';

interface Props {
  prompt?: string;
  options: ChoiceOption[];
  onSelect: (optionId: string) => void;
}

/**
 * Reply tray shown when the playhead is parked on a choice. Options render as
 * right-aligned outgoing-tinted chips — they are the player's possible words.
 * Silent options (say nothing) render dashed/italic with a mute icon.
 */
export function ChoiceList({ prompt, options, onSelect }: Props) {
  return (
    <View style={styles.wrap}>
      {prompt ? <Text style={styles.prompt}>{prompt}</Text> : null}
      {options.map((o) => (
        <Pressable
          key={o.id}
          style={({ pressed }) => [
            styles.option,
            o.silent && styles.optionSilent,
            pressed && (o.silent ? styles.silentPressed : styles.optionPressed),
          ]}
          onPress={() => onSelect(o.id)}
        >
          <View style={styles.optionRow}>
            {o.silent ? (
              <Ionicons name="volume-mute-outline" size={14} color={theme.colors.textDim} />
            ) : null}
            <Text style={[styles.optionText, o.silent && styles.silentText]}>{o.text}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 7,
    backgroundColor: '#0A0D12',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  prompt: { color: theme.colors.textFaint, fontSize: 11.5, textAlign: 'right', marginBottom: 2, marginRight: 6 },
  option: {
    alignSelf: 'flex-end',
    maxWidth: '88%',
    borderWidth: 1,
    borderColor: theme.colors.bubbleOut,
    backgroundColor: 'rgba(46,107,98,0.16)',
    borderRadius: 20,
    borderBottomRightRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  optionPressed: { backgroundColor: theme.colors.bubbleOut },
  optionSilent: {
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  silentPressed: { backgroundColor: theme.colors.surfaceAlt },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  optionText: { color: theme.colors.text, fontSize: 14.5, lineHeight: 20 },
  silentText: { color: theme.colors.textDim, fontStyle: 'italic' },
});
