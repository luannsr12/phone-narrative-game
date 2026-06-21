import React, { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { getSocialProfile, resolveComments, type ResolvedComment } from '@/utils/social';
import { evalCondition } from '@/utils/conditions';
import { useGameStore } from '@/store/gameStore';
import type { SocialPost, PostCommentOption } from '@/types/story';

interface Props {
  post: SocialPost;
  visible: boolean;
  onClose: () => void;
}

/** A single comment row (or reply): avatar, name, text, like heart + reply. */
function CommentRow({
  comment,
  postId,
  reply,
  replyOptions,
}: {
  comment: ResolvedComment;
  postId: string;
  reply?: boolean;
  replyOptions: PostCommentOption[];
}) {
  const playerName = useGameStore((s) => s.state?.playerName);
  const liked = useGameStore((s) => Boolean(s.state?.likedComments.includes(comment.id)));
  const likeOverride = useGameStore((s) => s.state?.commentLikes[comment.id]);
  const toggleCommentLike = useGameStore((s) => s.toggleCommentLike);
  const commentOnPost = useGameStore((s) => s.commentOnPost);
  const [replying, setReplying] = useState(false);

  const author = getSocialProfile(comment.author, playerName);
  const likes = (likeOverride ?? comment.baseLikes) + (liked ? 1 : 0);

  return (
    <View style={[styles.row, reply && styles.replyRow]}>
      <Avatar initials={author?.initials ?? '?'} color={author?.avatarColor} url={author?.avatarUrl} size={reply ? 26 : 32} />
      <View style={{ flex: 1 }}>
        <Text style={styles.text}>
          <Text style={styles.author}>{author?.name ?? comment.author} </Text>
          {comment.text}
        </Text>
        <View style={styles.metaRow}>
          {likes > 0 ? <Text style={styles.metaLikes}>{likes} curtida{likes > 1 ? 's' : ''}</Text> : null}
          {replyOptions.length > 0 ? (
            <Pressable onPress={() => setReplying((v) => !v)} hitSlop={6}>
              <Text style={styles.replyLink}>{replying ? 'cancelar' : 'Responder'}</Text>
            </Pressable>
          ) : null}
        </View>

        {replying ? (
          <View style={styles.replyOptions}>
            {replyOptions.map((o) => (
              <Pressable
                key={o.id}
                style={({ pressed }) => [styles.optionChip, pressed && styles.optionChipPressed]}
                onPress={() => {
                  commentOnPost(postId, o.id);
                  setReplying(false);
                }}
              >
                <Text style={styles.optionChipText}>{o.text}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <Pressable onPress={() => toggleCommentLike(comment.id)} hitSlop={8} style={styles.heart}>
        <Ionicons
          name={liked ? 'heart' : 'heart-outline'}
          size={15}
          color={liked ? '#E5687A' : theme.colors.textFaint}
        />
      </Pressable>
    </View>
  );
}

/** Instagram-style bottom drawer for a post's comments. */
export function CommentsSheet({ post, visible, onClose }: Props) {
  const state = useGameStore((s) => s.state);
  const commentOnPost = useGameStore((s) => s.commentOnPost);

  if (!state) return null;

  const resolved = resolveComments(post, state.postComments[post.id]);
  const tops = resolved.filter((c) => !c.replyTo);
  const repliesByParent = new Map<string, ResolvedComment[]>();
  for (const c of resolved) {
    if (!c.replyTo) continue;
    const arr = repliesByParent.get(c.replyTo) ?? [];
    arr.push(c);
    repliesByParent.set(c.replyTo, arr);
  }

  const available = (o: PostCommentOption) =>
    evalCondition(state, o.condition) && !state.choicesMade.includes(o.id);
  const replyOptionsFor = (commentId: string) =>
    (post.commentOptions ?? []).filter((o) => o.replyTo === commentId && available(o));
  const topOptions = (post.commentOptions ?? []).filter((o) => !o.replyTo && available(o));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdropWrap}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Comentários</Text>

          <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 8 }}>
            {resolved.length === 0 ? (
              <Text style={styles.empty}>Nenhum comentário ainda.</Text>
            ) : (
              tops.map((c) => (
                <View key={c.id}>
                  <CommentRow comment={c} postId={post.id} replyOptions={replyOptionsFor(c.id)} />
                  {(repliesByParent.get(c.id) ?? []).map((r) => (
                    <CommentRow key={r.id} comment={r} postId={post.id} reply replyOptions={[]} />
                  ))}
                </View>
              ))
            )}
          </ScrollView>

          {/* Composer — narrative-defined top-level comments. */}
          {topOptions.length > 0 ? (
            <View style={styles.composer}>
              <Text style={styles.composerHint}>Comentar:</Text>
              {topOptions.map((o) => (
                <Pressable
                  key={o.id}
                  style={({ pressed }) => [styles.optionChip, pressed && styles.optionChipPressed]}
                  onPress={() => commentOnPost(post.id, o.id)}
                >
                  <Text style={styles.optionChipText}>{o.text}</Text>
                </Pressable>
              ))}
            </View>
          ) : (
            <View style={styles.fakeInput}>
              <Ionicons name="happy-outline" size={18} color={theme.colors.textFaint} />
              <Text style={styles.fakeInputText}>Adicione um comentário…</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdropWrap: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    maxHeight: '78%',
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, backgroundColor: theme.colors.border, marginBottom: 8 },
  title: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  list: { marginTop: 4 },
  empty: { color: theme.colors.textFaint, textAlign: 'center', marginTop: 28, marginBottom: 12 },

  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 9 },
  replyRow: { marginLeft: 38 },
  text: { color: theme.colors.text, fontSize: 13.5, lineHeight: 19 },
  author: { fontWeight: '700' },
  metaRow: { flexDirection: 'row', gap: 14, marginTop: 4, alignItems: 'center' },
  metaLikes: { color: theme.colors.textFaint, fontSize: 11.5 },
  replyLink: { color: theme.colors.textDim, fontSize: 11.5, fontWeight: '700' },
  heart: { paddingTop: 3 },

  replyOptions: { marginTop: 8, gap: 7 },
  composer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingTop: 10,
    marginTop: 4,
    gap: 7,
  },
  composerHint: { color: theme.colors.textDim, fontSize: 12, fontWeight: '600', marginBottom: 1 },
  optionChip: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  optionChipPressed: { backgroundColor: theme.colors.surfaceHigh },
  optionChipText: { color: theme.colors.text, fontSize: 13, lineHeight: 18 },

  fakeInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    marginTop: 4,
  },
  fakeInputText: { color: theme.colors.textFaint, fontSize: 13.5 },
});
