import React from 'react';
import { View, Text, FlatList, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useGameStore, selectPublishedNews } from '@/store/gameStore';
import { mediaUrl } from '@/utils/media';
import type { Screen } from '@/navigation/types';

/**
 * General news reader: town life filler plus whatever the story published.
 * Cards are teasers — tapping one opens the full article on its (fictional)
 * website inside the in-game browser.
 */
export function NewsScreen({ navigation }: Screen<'News'>) {
  const state = useGameStore((s) => s.state);
  const articles = useGameStore((s) => selectPublishedNews(s.state));
  if (!state) return null;

  return (
    <View style={styles.bg}>
      <ScreenHeader title="Notícias"
        icon="newspaper"
        tint="#C2502E" onBack={() => navigation.navigate('Home')} />
      <FlatList
        data={articles}
        keyExtractor={(a) => a.id}
        ListEmptyComponent={<Text style={styles.empty}>Nenhuma notícia disponível no momento.</Text>}
        contentContainerStyle={{ padding: 14 }}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => navigation.navigate('Browser', { newsId: item.id })}
          >
            {mediaUrl(item.imageMedia, item.imageUrl) ? (
              <Image source={{ uri: mediaUrl(item.imageMedia, item.imageUrl) }} style={styles.image} />
            ) : null}
            <Text style={styles.outlet}>
              {item.outlet} · {item.date}
            </Text>
            <Text style={styles.headline}>{item.headline}</Text>
            <Text style={styles.body} numberOfLines={3}>
              {item.body}
            </Text>
            <View style={styles.readMore}>
              <Text style={styles.readMoreText}>Ler matéria completa</Text>
              <Ionicons name="open-outline" size={13} color={theme.colors.accent} />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  empty: { color: theme.colors.textFaint, textAlign: 'center', marginTop: 48 },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 16,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  pressed: { backgroundColor: theme.colors.surfaceHigh },
  image: {
    height: 150,
    borderRadius: theme.radius.sm,
    marginBottom: 12,
    backgroundColor: theme.colors.surfaceHigh,
  },
  outlet: { color: theme.colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  headline: { color: theme.colors.text, fontSize: 18, fontWeight: '800', marginTop: 6, lineHeight: 24 },
  body: { color: theme.colors.textDim, fontSize: 14.5, lineHeight: 22, marginTop: 8 },
  readMore: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 12 },
  readMoreText: { color: theme.colors.accent, fontSize: 13, fontWeight: '600' },
});
