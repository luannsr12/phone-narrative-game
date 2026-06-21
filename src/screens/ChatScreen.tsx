import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { ChatBubble } from '@/components/ChatBubble';
import { TypingIndicator } from '@/components/TypingIndicator';
import { ChoiceList } from '@/components/ChoiceList';
import { FakeInputBar } from '@/components/phone/FakeInputBar';
import {
  useGameStore,
  selectCurrentNode,
  selectAvailableOptions,
  selectThreadIndicator,
} from '@/store/gameStore';
import { useUiStore } from '@/store/uiStore';
import { charAvatar, displayName, getCharacter, isUnknown, presence, lastCharacterActivity } from '@/utils/people';
import { interpolate } from '@/utils/template';
import { pageUrl, type LinkTarget } from '@/utils/links';
import { mediaUrl } from '@/utils/media';
import { story } from '@/story';
import type { ChatEntry } from '@/types/game';
import type { Screen } from '@/navigation/types';

type Row =
  | ChatEntry
  | { sep: true; id: string; label: string }
  | { newMsgs: true; id: string };

type ActivityKind = 'typing' | 'audio' | 'video';
const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  typing: 'digitando…',
  audio: 'gravando áudio…',
  video: 'gravando vídeo…',
};

function dayLabel(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return 'Hoje';
  const y = new Date(today.getTime() - 86_400_000);
  if (d.toDateString() === y.toDateString()) return 'Ontem';
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, '0')}/${d.getFullYear()}`;
}

/**
 * Interleave day-separator chips into the transcript, messenger-style.
 * `newMsgsAnchor` marks the first message of the burst that arrived while the
 * player was away (WhatsApp's "Novas mensagens" divider).
 */
function withSeparators(entries: ChatEntry[], newMsgsAnchor: string | null): Row[] {
  const rows: Row[] = [];
  let lastDay = '';
  for (const e of entries) {
    const day = new Date(e.at).toDateString();
    if (day !== lastDay) {
      rows.push({ sep: true, id: `sep_${day}`, label: dayLabel(e.at) });
      lastDay = day;
    }
    if (e.id === newMsgsAnchor) {
      rows.push({ newMsgs: true, id: 'new_msgs' });
    }
    rows.push(e);
  }
  return rows;
}

/**
 * Where the "Novas mensagens" divider sits for this visit: the first message
 * that arrived while the player was away from this chat — exactly the unread
 * burst, WhatsApp-style. No time gap involved: leaving and coming back to even
 * a single new message shows the divider. `unread` only counts the contact's
 * messages (player replies never bump it) and resets to 0 once viewed, so the
 * trailing `unread` entries are precisely the ones not yet seen. Skipped when
 * the whole thread is unread (a brand-new chat has nothing to divide from).
 */
function computeNewMsgsAnchor(threadId: string): string | null {
  const thread = useGameStore.getState().state?.threads[threadId];
  const unread = thread?.unread ?? 0;
  if (!thread || unread === 0 || thread.entries.length <= unread) return null;
  return thread.entries[thread.entries.length - unread].id;
}

/**
 * Route an inline message link to the right in-game app — fictional pages and
 * news open in the browser; posts/profiles open in Mural. Never a real site.
 */
function openInlineLink(navigation: Screen<'Chat'>['navigation'], t: LinkTarget) {
  switch (t.kind) {
    case 'news':
      navigation.navigate('Browser', { newsId: t.id });
      break;
    case 'page': {
      const p = story.pages?.[t.id];
      if (!p) break;
      navigation.navigate('Browser', {
        page: { url: pageUrl(p), title: p.title, body: p.body, image: mediaUrl(p.imageMedia, p.imageUrl) },
      });
      break;
    }
    case 'post':
      navigation.navigate('SocialPost', { postId: t.id });
      break;
    case 'profile':
      navigation.navigate('SocialProfile', { account: t.id });
      break;
  }
}

export function ChatScreen({ navigation, route }: Screen<'Chat'>) {
  const { threadId } = route.params;
  const state = useGameStore((s) => s.state);
  const choose = useGameStore((s) => s.choose);
  const markThreadRead = useGameStore((s) => s.markThreadRead);
  const typingNodeIds = useUiStore((s) => s.typingNodeIds);
  const listRef = useRef<FlatList<Row>>(null);
  const [awayFromBottom, setAwayFromBottom] = useState(false);
  // Reply options stay hidden until the player taps the input bar — like
  // tapping a real message box opens the keyboard.
  const [composerOpen, setComposerOpen] = useState(false);

  const thread = state?.threads[threadId];
  const entries = thread?.entries ?? [];

  // Captured ONCE per visit, during the first render — before the mark-read
  // effect below clears the unread count the divider position depends on.
  const anchorRef = useRef<{ tid: string; id: string | null } | null>(null);
  if (!anchorRef.current || anchorRef.current.tid !== threadId) {
    anchorRef.current = { tid: threadId, id: computeNewMsgsAnchor(threadId) };
  }
  const newMsgsAnchor = anchorRef.current.id;

  // Inverted list: index 0 renders at the bottom, so the chat opens anchored
  // to the latest message and stays pinned as new ones arrive — real
  // messenger behavior, no scroll jumps.
  const rows = useMemo(
    () => withSeparators(entries, newMsgsAnchor).reverse(),
    [entries, newMsgsAnchor],
  );

  // Mark read while viewing.
  useEffect(() => {
    if (thread && thread.unread > 0) markThreadRead(threadId);
  }, [threadId, entries.length, thread, markThreadRead]);

  if (!state) return null;

  const node = selectCurrentNode(state);
  const gated = Boolean(state.endingId || state.justCompletedChapter);
  // The contact is visibly busy (digitando…/gravando…) only during the visible
  // phase: the driver holds a silent "human reaction" lag first (messages), or
  // shows an `activity` node's indicator for its authored duration. The delivery
  // may come from the main line OR a parallel fork track — scan them all.
  const liveIndicator = gated ? null : selectThreadIndicator(state, threadId, typingNodeIds);
  const activityKind: ActivityKind | null = liveIndicator
    ? liveIndicator.type === 'activity'
      ? liveIndicator.kind
      : 'typing'
    : null;
  const typing = Boolean(liveIndicator);
  const choicePending = !gated && node?.type === 'choice' && node.thread === threadId;
  const showChoices = choicePending && composerOpen;
  const options = choicePending
    ? selectAvailableOptions(state).map((o) => ({
        ...o,
        text: interpolate(o.text, { playerName: state.playerName, gender: state.playerGender }),
      }))
    : [];

  const ch = getCharacter(threadId);
  const unknown = isUnknown(state, threadId);
  // Presence is random flavor (stable for ~5 min) — like a real messenger,
  // it says nothing about whether the story will answer. Anchored to their
  // last sent message so "visto por último" never contradicts the chat.
  const subtitle = activityKind
    ? ACTIVITY_LABEL[activityKind]
    : presence(threadId, Date.now(), lastCharacterActivity(state, threadId), state.presence?.[threadId])
        .label;

  const scrollToBottom = () =>
    listRef.current?.scrollToOffset({ offset: 0, animated: true });

  return (
    <View style={styles.bg}>
      {/* Messenger-style header: back, avatar, name + presence, call icon. */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Pressable
          style={styles.identity}
          onPress={() => navigation.navigate('ContactProfile', { characterId: threadId })}
        >
          <Avatar initials={ch?.initials ?? '?'} color={ch?.avatarColor} unknown={unknown} url={charAvatar(ch)} size={38} />
          <View style={styles.nameCol}>
            <Text style={styles.name} numberOfLines={1}>
              {displayName(state, threadId)}
            </Text>
            <Text style={[styles.sub, typing && styles.subTyping]} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
        </Pressable>
        <Ionicons name="call-outline" size={19} color={theme.colors.textDim} style={styles.headerIcon} />
        <Ionicons name="ellipsis-vertical" size={17} color={theme.colors.textDim} style={styles.headerIconLast} />
      </View>

      <View style={styles.listWrap}>
        <FlatList
          ref={listRef}
          data={rows}
          inverted
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          // In an inverted list the header sits at the BOTTOM (latest side)…
          ListHeaderComponent={typing ? <TypingIndicator kind={activityKind ?? 'typing'} /> : <View style={{ height: 6 }} />}
          // …and the footer at the TOP (oldest side).
          ListFooterComponent={
            <View style={styles.cryptoChip}>
              <Text style={styles.cryptoText}>
                <Ionicons name="lock-closed" size={10} color="#C9AC74" /> As mensagens desta
                conversa são protegidas com criptografia de ponta a ponta.
              </Text>
            </View>
          }
          onScroll={(e) => setAwayFromBottom(e.nativeEvent.contentOffset.y > 240)}
          scrollEventThrottle={80}
          renderItem={({ item }) =>
            'newMsgs' in item ? (
              <View style={styles.newMsgsRow}>
                <View style={styles.newMsgsLine} />
                <Text style={styles.newMsgsText}>Novas mensagens</Text>
                <View style={styles.newMsgsLine} />
              </View>
            ) : 'sep' in item ? (
              <View style={styles.sepWrap}>
                <View style={styles.sepChip}>
                  <Text style={styles.sepText}>{item.label}</Text>
                </View>
              </View>
            ) : (
              <ChatBubble
                entry={item}
                senderName={displayName(state, item.speaker)}
                onAttachmentPress={(evidenceId) => navigation.navigate('FileDetail', { evidenceId })}
                onLinkPress={(a) =>
                  navigation.navigate(
                    'Browser',
                    a.news
                      ? { newsId: a.news }
                      : { page: { url: a.url ?? '', title: a.label, body: a.pageBody } },
                  )
                }
                onOpenLink={(t) => openInlineLink(navigation, t)}
                onContactPress={(characterId) =>
                  characterId === threadId
                    ? undefined
                    : navigation.push('Chat', { threadId: characterId })
                }
              />
            )
          }
        />

        {awayFromBottom ? (
          <Pressable style={styles.toBottom} onPress={scrollToBottom}>
            <Ionicons name="chevron-down" size={20} color={theme.colors.text} />
          </Pressable>
        ) : null}
      </View>

      {showChoices ? (
        <View>
          {/* Drag-handle style dismiss, to re-read the chat without answering. */}
          <Pressable style={styles.choicesDismiss} onPress={() => setComposerOpen(false)} hitSlop={6}>
            <Ionicons name="chevron-down" size={16} color={theme.colors.textFaint} />
          </Pressable>
          <ChoiceList
            options={options}
            onSelect={(id) => {
              setComposerOpen(false);
              choose(id);
            }}
          />
        </View>
      ) : (
        <FakeInputBar
          hint={choicePending ? 'Toque para responder…' : undefined}
          onPress={choicePending ? () => setComposerOpen(true) : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#0A0D12' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  backBtn: { paddingHorizontal: 8, paddingVertical: 4 },
  identity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  nameCol: { flex: 1 },
  name: { color: theme.colors.text, fontSize: 16, fontWeight: '700' },
  sub: { color: theme.colors.textDim, fontSize: 12, marginTop: 1 },
  subTyping: { color: theme.colors.accent },
  headerIcon: { paddingHorizontal: 8 },
  headerIconLast: { paddingLeft: 4, paddingRight: 10 },

  listWrap: { flex: 1 },
  list: { paddingVertical: 10 },
  cryptoChip: {
    alignSelf: 'center',
    backgroundColor: 'rgba(229,181,103,0.10)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginHorizontal: 28,
    marginBottom: 10,
  },
  cryptoText: { color: '#C9AC74', fontSize: 11.5, textAlign: 'center', lineHeight: 16 },
  sepWrap: { alignItems: 'center', marginVertical: 8 },
  sepChip: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sepText: { color: theme.colors.textDim, fontSize: 11.5 },
  newMsgsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
    paddingHorizontal: 24,
  },
  newMsgsLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.accent, opacity: 0.55 },
  newMsgsText: { color: theme.colors.accent, fontSize: 11.5, fontWeight: '700' },
  choicesDismiss: {
    alignItems: 'center',
    paddingVertical: 3,
    backgroundColor: '#0A0D12',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  toBottom: {
    position: 'absolute',
    right: 12,
    bottom: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: theme.colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    elevation: 4,
  },
});
