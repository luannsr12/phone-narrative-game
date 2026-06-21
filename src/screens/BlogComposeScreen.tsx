import React from 'react';
import { View, Text, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useGameStore } from '@/store/gameStore';
import { evalCondition } from '@/utils/conditions';
import { blogImageUrl } from '@/utils/blog';
import { story } from '@/story';
import type { Screen } from '@/navigation/types';

const BLOG_TINT = '#5C6BC0';

/**
 * Compose a Blog matéria: the player picks the angle/content from the
 * narrative-defined options. Tapping an angle opens a full PREVIEW of how the
 * article will read once published (BlogPreview), where it is actually
 * published — so the player always sees the result before committing.
 */
export function BlogComposeScreen({ navigation, route }: Screen<'BlogCompose'>) {
  const { blogId } = route.params;
  const state = useGameStore((s) => s.state);

  const draft = story.blog[blogId];
  // Already published or no longer a draft → bounce to the right place.
  if (!state || !draft) {
    navigation.goBack();
    return null;
  }
  if (!state.blogDrafts.includes(blogId)) {
    navigation.replace('BlogDetail', { blogId });
    return null;
  }

  const options = draft.options.filter((o) => evalCondition(state, o.condition));

  return (
    <View style={styles.bg}>
      <ScreenHeader title="Nova matéria" icon="create" tint={BLOG_TINT} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {blogImageUrl(draft) ? <Image source={{ uri: blogImageUrl(draft)! }} style={styles.image} /> : null}
        <Text style={styles.title}>{draft.title}</Text>

        <Text style={styles.prompt}>Escolha o ângulo da matéria para pré-visualizar:</Text>
        {options.map((o) => (
          <Pressable
            key={o.id}
            style={styles.option}
            onPress={() => navigation.navigate('BlogPreview', { blogId, optionId: o.id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.optionLabel}>{o.label}</Text>
              <Text style={styles.optionPreview} numberOfLines={3}>{o.body}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textFaint} />
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  image: { height: 150, borderRadius: theme.radius.sm, marginBottom: 14, backgroundColor: theme.colors.surfaceHigh },
  title: { color: theme.colors.text, fontSize: 20, fontWeight: '800', lineHeight: 26 },
  prompt: { color: theme.colors.textDim, fontSize: 13.5, fontWeight: '600', marginTop: 20, marginBottom: 10 },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  optionLabel: { color: theme.colors.text, fontSize: 14.5, fontWeight: '700' },
  optionPreview: { color: theme.colors.textDim, fontSize: 13, lineHeight: 19, marginTop: 4 },
});
