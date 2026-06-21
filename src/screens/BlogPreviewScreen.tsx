import React from 'react';
import { View, Text, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useGameStore } from '@/store/gameStore';
import { getSocialProfile } from '@/utils/social';
import { blogImageUrl } from '@/utils/blog';
import { story } from '@/story';
import type { Screen } from '@/navigation/types';

const BLOG_TINT = '#5C6BC0';

/**
 * Preview a Blog matéria EXACTLY as it will read once published (chosen angle),
 * before committing. From here the player publishes, or goes back to pick a
 * different angle. Publishing applies the option's effects and opens the real
 * article (where it can be shared to a Mural story).
 */
export function BlogPreviewScreen({ navigation, route }: Screen<'BlogPreview'>) {
  const { blogId, optionId } = route.params;
  const state = useGameStore((s) => s.state);
  const publishBlog = useGameStore((s) => s.publishBlog);

  const draft = story.blog[blogId];
  const option = draft?.options.find((o) => o.id === optionId);
  if (!state || !draft || !option) {
    navigation.goBack();
    return null;
  }
  // Already published → show the real article instead of a stale preview.
  if (!state.blogDrafts.includes(blogId)) {
    navigation.replace('BlogDetail', { blogId });
    return null;
  }

  const me = getSocialProfile('player', state.playerName);
  const paragraphs = option.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  const onPublish = () => {
    publishBlog(blogId, optionId);
    navigation.replace('BlogDetail', { blogId });
  };

  return (
    <View style={styles.bg}>
      <ScreenHeader title="Pré-visualização" icon="eye" tint={BLOG_TINT} onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={styles.chip}>
          <Ionicons name="eye-outline" size={13} color={theme.colors.textDim} />
          <Text style={styles.chipText}>Pré-visualização — ainda não publicada</Text>
        </View>

        <Text style={styles.title}>{draft.title}</Text>
        <Text style={styles.byline}>
          Por {me?.name ?? state.playerName}
          {draft.date ? ` · ${draft.date}` : ''}
        </Text>

        {blogImageUrl(draft) ? <Image source={{ uri: blogImageUrl(draft)! }} style={styles.image} /> : null}

        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.para}>{p}</Text>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.publishBtn} onPress={onPublish}>
          <Ionicons name="paper-plane" size={17} color="#FFFFFF" />
          <Text style={styles.publishText}>Publicar matéria</Text>
        </Pressable>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={15} color={theme.colors.textDim} />
          <Text style={styles.backText}>Voltar e escolher outro ângulo</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: theme.colors.surfaceHigh,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginBottom: 14,
  },
  chipText: { color: theme.colors.textDim, fontSize: 11.5, fontWeight: '600' },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '800', lineHeight: 29 },
  byline: { color: theme.colors.textFaint, fontSize: 12.5, marginTop: 8 },
  image: { height: 180, borderRadius: theme.radius.sm, marginTop: 14, backgroundColor: theme.colors.surfaceHigh },
  para: { color: theme.colors.text, fontSize: 15, lineHeight: 24, marginTop: 14 },

  footer: {
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BLOG_TINT,
    borderRadius: theme.radius.md,
    paddingVertical: 13,
  },
  publishText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '700' },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    marginTop: 4,
  },
  backText: { color: theme.colors.textDim, fontSize: 13.5, fontWeight: '600' },
});
