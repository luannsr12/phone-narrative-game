import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { PostCard } from '@/components/social/PostCard';
import { useGameStore } from '@/store/gameStore';
import { useUiStore } from '@/store/uiStore';
import { story } from '@/story';
import type { Screen } from '@/navigation/types';

/** A single Mural post on its own screen (opened from a profile grid / notification). */
export function SocialPostScreen({ navigation, route }: Screen<'SocialPost'>) {
  const { postId } = route.params;
  const state = useGameStore((s) => s.state);
  const toggleLike = useGameStore((s) => s.toggleLike);
  const showDialog = useUiStore((s) => s.showDialog);

  const post = story.social[postId];
  if (!state || !post) {
    navigation.goBack();
    return null;
  }

  return (
    <View style={styles.bg}>
      <View style={styles.appBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.title}>Publicação</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView>
        <PostCard
          post={post}
          liked={state.likedPosts.includes(post.id)}
          onLike={() => toggleLike(post.id)}
          onShare={() => showDialog('Não foi possível compartilhar a publicação.')}
          onOpenProfile={(account) =>
            account === 'player' ? undefined : navigation.navigate('SocialProfile', { account })
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0A0D12' },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  title: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },
});
