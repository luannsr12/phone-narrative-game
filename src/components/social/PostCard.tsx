import React, { useState } from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { CommentsSheet } from '@/components/social/CommentsSheet';
import { getSocialProfile, resolveComments } from '@/utils/social';
import { mediaUrl } from '@/utils/media';
import { useGameStore } from '@/store/gameStore';
import type { SocialPost } from '@/types/story';

interface Props {
  post: SocialPost;
  liked: boolean;
  onLike: () => void;
  onShare: () => void;
  onOpenProfile?: (account: string) => void;
}

/** A Mural feed card — header taps through to the author's profile. */
export function PostCard({ post, liked, onLike, onShare, onOpenProfile }: Props) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const state = useGameStore((s) => s.state);

  const author = getSocialProfile(post.author, state?.playerName, state?.followStats[post.author]);
  const likes = (state?.postLikes[post.id] ?? post.likes) + (liked ? 1 : 0);
  const postImg = mediaUrl(post.imageMedia, post.imageUrl);

  // Authored + runtime comments, threaded — preview the first top-level ones.
  const comments = resolveComments(post, state?.postComments[post.id]);
  const tops = comments.filter((c) => !c.replyTo);
  const preview = tops.slice(0, 2);

  return (
    <View style={styles.post}>
      <Pressable style={styles.postHead} onPress={() => onOpenProfile?.(post.author)}>
        <Avatar
          initials={author?.initials ?? '?'}
          color={author?.avatarColor}
          url={author?.avatarUrl}
          size={34}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.postAuthor}>{author?.name ?? post.author}</Text>
          <Text style={styles.postHandle}>
            @{author?.handle ?? post.author} · {post.date}
          </Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={16} color={theme.colors.textDim} />
      </Pressable>

      {postImg ? <Image source={{ uri: postImg }} style={styles.postImage} /> : null}

      <View style={styles.actions}>
        <Pressable onPress={onLike} hitSlop={8}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={24}
            color={liked ? '#E5687A' : theme.colors.text}
          />
        </Pressable>
        <Pressable onPress={() => setCommentsOpen(true)} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={22} color={theme.colors.text} />
        </Pressable>
        <Pressable onPress={onShare} hitSlop={8}>
          <Ionicons name="paper-plane-outline" size={22} color={theme.colors.text} />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Ionicons name="bookmark-outline" size={22} color={theme.colors.text} />
      </View>

      <Text style={styles.likes}>{likes} curtidas</Text>
      <Text style={styles.caption}>
        <Text style={styles.captionAuthor}>{author?.name ?? post.author} </Text>
        {post.caption}
      </Text>

      {comments.length > 0 ? (
        <Pressable onPress={() => setCommentsOpen(true)}>
          <Text style={styles.moreComments}>
            {comments.length === 1 ? 'ver 1 comentário' : `ver todos os ${comments.length} comentários`}
          </Text>
        </Pressable>
      ) : null}
      {preview.map((c) => {
        const cp = getSocialProfile(c.author, state?.playerName);
        return (
          <Text key={c.id} style={styles.comment} numberOfLines={1}>
            <Text style={styles.captionAuthor}>{cp?.name ?? c.author} </Text>
            {c.text}
          </Text>
        );
      })}

      {/* Tap a comment to open the bottom drawer (like / comment / reply). */}
      {post.commentOptions?.length || comments.length ? (
        <Pressable onPress={() => setCommentsOpen(true)} hitSlop={4}>
          <Text style={styles.addComment}>Comentar…</Text>
        </Pressable>
      ) : null}

      <CommentsSheet post={post} visible={commentsOpen} onClose={() => setCommentsOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  post: { paddingBottom: 18, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  postHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  postAuthor: { color: theme.colors.text, fontSize: 13.5, fontWeight: '700' },
  postHandle: { color: theme.colors.textFaint, fontSize: 11 },
  postImage: { width: '100%', aspectRatio: 1, backgroundColor: theme.colors.surfaceHigh },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 12, paddingTop: 10 },
  likes: { color: theme.colors.text, fontSize: 13, fontWeight: '700', paddingHorizontal: 12, marginTop: 8 },
  caption: { color: theme.colors.text, fontSize: 13.5, lineHeight: 19, paddingHorizontal: 12, marginTop: 4 },
  captionAuthor: { fontWeight: '700' },
  moreComments: { color: theme.colors.textFaint, fontSize: 12.5, paddingHorizontal: 12, marginTop: 6 },
  comment: { color: theme.colors.textDim, fontSize: 13, lineHeight: 18, paddingHorizontal: 12, marginTop: 4 },
  addComment: { color: theme.colors.textFaint, fontSize: 12.5, paddingHorizontal: 12, marginTop: 8 },
});
