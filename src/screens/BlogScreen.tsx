import React from 'react';
import { View, Text, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useGameStore, selectBlogDrafts, selectPublishedBlog } from '@/store/gameStore';
import { blogImageUrl, blogOutletName } from '@/utils/blog';
import type { Screen } from '@/navigation/types';

const BLOG_TINT = '#5C6BC0';

/** First non-empty line of the published body — a teaser for the list. */
function excerpt(body: string): string {
  return body.split(/\n\s*\n/)[0]?.trim() ?? '';
}

/**
 * The player's Blog — where the investigative journalist writes and publishes
 * matérias. "Rascunhos" are pautas the story has handed the player; "Publicadas"
 * are the articles already out. Content is always chosen from narrative options.
 */
export function BlogScreen({ navigation }: Screen<'Blog'>) {
  const state = useGameStore((s) => s.state);
  const drafts = useGameStore((s) => selectBlogDrafts(s.state));
  const published = useGameStore((s) => selectPublishedBlog(s.state));
  if (!state) return null;

  const empty = drafts.length === 0 && published.length === 0;

  return (
    <View style={styles.bg}>
      <ScreenHeader title={blogOutletName()} subtitle="Suas matérias" icon="newspaper" tint={BLOG_TINT} onBack={() => navigation.navigate('Home')} />
      <ScrollView contentContainerStyle={{ padding: 14 }}>
        {empty ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="create-outline" size={36} color={theme.colors.textFaint} />
            <Text style={styles.empty}>Nada por aqui ainda. Quando você tiver o que publicar, a pauta aparece aqui.</Text>
          </View>
        ) : null}

        {drafts.length > 0 ? (
          <>
            <Text style={styles.section}>Rascunhos</Text>
            {drafts.map((d) => (
              <Pressable
                key={d.id}
                style={({ pressed }) => [styles.draftCard, pressed && styles.pressed]}
                onPress={() => navigation.navigate('BlogCompose', { blogId: d.id })}
              >
                <View style={styles.draftIcon}>
                  <Ionicons name="document-text-outline" size={18} color={BLOG_TINT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.draftTitle} numberOfLines={2}>{d.title}</Text>
                  <Text style={styles.draftHint}>Toque para escrever e publicar</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={theme.colors.textFaint} />
              </Pressable>
            ))}
          </>
        ) : null}

        {published.length > 0 ? (
          <>
            <Text style={[styles.section, drafts.length > 0 && { marginTop: 18 }]}>Publicadas</Text>
            {published.map(({ post, option, shared }) => (
              <Pressable
                key={post.id}
                style={({ pressed }) => [styles.card, pressed && styles.pressed]}
                onPress={() => navigation.navigate('BlogDetail', { blogId: post.id })}
              >
                {blogImageUrl(post) ? <Image source={{ uri: blogImageUrl(post)! }} style={styles.image} /> : null}
                <Text style={styles.title}>{post.title}</Text>
                <Text style={styles.body} numberOfLines={3}>{excerpt(option.body)}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.date}>{post.date ?? 'Publicada'}</Text>
                  {shared ? (
                    <View style={styles.sharedTag}>
                      <Ionicons name="checkmark-circle" size={12} color={theme.colors.accent} />
                      <Text style={styles.sharedText}>no Mural</Text>
                    </View>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 10, paddingHorizontal: 30 },
  empty: { color: theme.colors.textFaint, textAlign: 'center', lineHeight: 20 },

  section: { color: theme.colors.textDim, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 8 },

  draftCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: `${BLOG_TINT}66`,
  },
  draftIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  draftTitle: { color: theme.colors.text, fontSize: 14.5, fontWeight: '700', lineHeight: 19 },
  draftHint: { color: theme.colors.textFaint, fontSize: 11.5, marginTop: 2 },

  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  pressed: { backgroundColor: theme.colors.surfaceHigh },
  image: { height: 140, borderRadius: theme.radius.sm, marginBottom: 12, backgroundColor: theme.colors.surfaceHigh },
  title: { color: theme.colors.text, fontSize: 17, fontWeight: '800', lineHeight: 23 },
  body: { color: theme.colors.textDim, fontSize: 14, lineHeight: 21, marginTop: 8 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  date: { color: theme.colors.textFaint, fontSize: 11.5 },
  sharedTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sharedText: { color: theme.colors.accent, fontSize: 11.5, fontWeight: '600' },
});
