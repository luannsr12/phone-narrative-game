import React from 'react';
import { View, Text, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useGameStore, selectPublishedBlog } from '@/store/gameStore';
import { getSocialProfile } from '@/utils/social';
import { blogImageUrl } from '@/utils/blog';
import type { Screen } from '@/navigation/types';

const BLOG_TINT = '#5C6BC0';

/** A published Blog matéria, with the option to share it as a Mural story. */
export function BlogDetailScreen({ navigation, route }: Screen<'BlogDetail'>) {
  const { blogId } = route.params;
  const state = useGameStore((s) => s.state);
  const published = useGameStore((s) => selectPublishedBlog(s.state));
  const shareBlogToMural = useGameStore((s) => s.shareBlogToMural);

  const entry = published.find((e) => e.post.id === blogId);
  if (!state || !entry) {
    // Not published yet (still a draft) or unknown — go compose / back.
    if (state?.blogDrafts.includes(blogId)) navigation.replace('BlogCompose', { blogId });
    else navigation.goBack();
    return null;
  }

  const { post, option, shared } = entry;
  const me = getSocialProfile('player', state.playerName);
  const paragraphs = option.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const canShare = Boolean(post.muralStory);

  return (
    <View style={styles.bg}>
      <ScreenHeader title="Matéria" icon="newspaper" tint={BLOG_TINT} onBack={() => navigation.navigate('Blog')} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.byline}>
          Por {me?.name ?? state.playerName}
          {post.date ? ` · ${post.date}` : ''}
        </Text>

        {blogImageUrl(post) ? <Image source={{ uri: blogImageUrl(post)! }} style={styles.image} /> : null}

        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.para}>{p}</Text>
        ))}

        {canShare ? (
          shared ? (
            <View style={[styles.shareBtn, styles.shareBtnDone]}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.accent} />
              <Text style={styles.shareDoneText}>Compartilhado no story do Mural</Text>
            </View>
          ) : (
            <Pressable style={styles.shareBtn} onPress={() => shareBlogToMural(blogId)}>
              <Ionicons name="share-social" size={17} color="#FFFFFF" />
              <Text style={styles.shareText}>Compartilhar no story do Mural</Text>
            </Pressable>
          )
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: '800', lineHeight: 29 },
  byline: { color: theme.colors.textFaint, fontSize: 12.5, marginTop: 8 },
  image: { height: 180, borderRadius: theme.radius.sm, marginTop: 14, backgroundColor: theme.colors.surfaceHigh },
  para: { color: theme.colors.text, fontSize: 15, lineHeight: 24, marginTop: 14 },

  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: BLOG_TINT,
    borderRadius: theme.radius.md,
    paddingVertical: 13,
    marginTop: 26,
  },
  shareText: { color: '#FFFFFF', fontSize: 14.5, fontWeight: '700' },
  shareBtnDone: { backgroundColor: theme.colors.surfaceHigh },
  shareDoneText: { color: theme.colors.accent, fontSize: 14, fontWeight: '700' },
});
