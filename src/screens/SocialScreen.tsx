import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, Pressable, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { PostCard } from '@/components/social/PostCard';
import { AdCard } from '@/components/ads/AdCard';
import { MuralTabBar, type MuralTab } from '@/components/social/MuralTabBar';
import { MuralProfile } from '@/screens/SocialMyProfileScreen';
import {
  useGameStore,
  selectVisiblePosts,
  selectStoryGroups,
  selectSearchableAccounts,
  selectPlayerStory,
  selectSocialNotifications,
  selectUnreadSocialCount,
  selectAds,
} from '@/store/gameStore';
import { useUiStore } from '@/store/uiStore';
import { getSocialProfile } from '@/utils/social';
import { clock } from '@/utils/format';
import type { Ad, SocialPost } from '@/types/story';
import type { Screen } from '@/navigation/types';

type Nav = Screen<'Social'>['navigation'];
const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

type FeedRow = { kind: 'post'; key: string; post: SocialPost } | { kind: 'ad'; key: string; ad: Ad };

/** Weave sponsored posts into the feed, Instagram-style (first at slot 2). */
function buildFeed(posts: SocialPost[], ads: Ad[]): FeedRow[] {
  const rows: FeedRow[] = posts.map((p) => ({ kind: 'post', key: p.id, post: p }));
  if (!ads.length || !posts.length) return rows;
  const AD_EVERY = 6;
  const out: FeedRow[] = [];
  let adIdx = 0;
  rows.forEach((row, i) => {
    out.push(row);
    if (i === 0 || (i > 0 && (i + 1) % AD_EVERY === 0)) {
      const ad = ads[adIdx % ads.length];
      out.push({ kind: 'ad', key: `ad_${ad.id}_${i}`, ad });
      adIdx += 1;
    }
  });
  return out;
}

// ---------------------------------------------------------------------------
// Feed tab
// ---------------------------------------------------------------------------
function FeedTab({ navigation, onDirect, onGoProfile }: { navigation: Nav; onDirect: () => void; onGoProfile: () => void }) {
  const state = useGameStore((s) => s.state);
  const posts = useGameStore((s) => selectVisiblePosts(s.state));
  const storyGroups = useGameStore((s) => selectStoryGroups(s.state));
  const playerStory = useGameStore((s) => selectPlayerStory(s.state));
  const toggleLike = useGameStore((s) => s.toggleLike);
  const showDialog = useUiStore((s) => s.showDialog);

  const ads = useMemo(() => selectAds('social'), []);
  const feed = useMemo(() => buildFeed(posts, ads), [posts, ads]);
  if (!state) return null;
  const me = getSocialProfile('player', state.playerName);

  const openProfile = (account: string) => navigation.navigate('SocialProfile', { account });
  const openAd = (ad: Ad) =>
    navigation.navigate('Browser', { page: { url: ad.url ?? '', title: ad.brand, body: ad.caption } });

  return (
    <View style={styles.bg}>
      {/* Top bar — only the Direct icon on the right, per a real app. */}
      <View style={styles.appBar}>
        <Text style={styles.logo}>Mural</Text>
        <Pressable onPress={onDirect} hitSlop={8}>
          <Ionicons name="paper-plane-outline" size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={feed}
        keyExtractor={(r) => r.key}
        ListHeaderComponent={
          <View style={styles.stories}>
            <Pressable
              style={styles.story}
              onPress={() => (playerStory ? navigation.navigate('StoryViewer', { author: 'player' }) : onGoProfile())}
            >
              {playerStory && !playerStory.seen ? (
                <LinearGradient colors={['#E4C56C', '#C46CB8', '#6C8AE4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.storyRing}>
                  <View style={styles.storyInner}>
                    <Avatar initials={me?.initials ?? '?'} color={me?.avatarColor ?? theme.colors.accentDim} url={me?.avatarUrl} size={52} />
                  </View>
                </LinearGradient>
              ) : (
                <View style={[styles.storyRingIdle, playerStory ? styles.storyRingSeen : null]}>
                  <Avatar initials={me?.initials ?? '?'} color={me?.avatarColor ?? theme.colors.accentDim} url={me?.avatarUrl} size={54} />
                </View>
              )}
              <Text style={styles.storyName} numberOfLines={1}>Seu story</Text>
            </Pressable>
            {storyGroups.map((g) => {
              const p = getSocialProfile(g.author);
              if (!p) return null;
              return (
                <Pressable key={g.author} style={styles.story} onPress={() => navigation.navigate('StoryViewer', { author: g.author })}>
                  {g.seen ? (
                    <View style={[styles.storyRingIdle, styles.storyRingSeen]}>
                      <Avatar initials={p.initials} color={p.avatarColor} url={p.avatarUrl} size={52} />
                    </View>
                  ) : (
                    <LinearGradient colors={['#E4C56C', '#C46CB8', '#6C8AE4']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.storyRing}>
                      <View style={styles.storyInner}>
                        <Avatar initials={p.initials} color={p.avatarColor} url={p.avatarUrl} size={52} />
                      </View>
                    </LinearGradient>
                  )}
                  <Text style={styles.storyName} numberOfLines={1}>{p.name.toLowerCase().split(' ')[0]}</Text>
                </Pressable>
              );
            })}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyFeed}>
            <Ionicons name="people-outline" size={36} color={theme.colors.textFaint} />
            <Text style={styles.empty}>Seu feed está vazio. Use a busca para encontrar e seguir perfis.</Text>
          </View>
        }
        renderItem={({ item }) =>
          item.kind === 'ad' ? (
            <AdCard ad={item.ad} onPress={() => openAd(item.ad)} />
          ) : (
            <PostCard
              post={item.post}
              liked={state.likedPosts.includes(item.post.id)}
              onLike={() => toggleLike(item.post.id)}
              onShare={() => showDialog('Não foi possível compartilhar a publicação.')}
              onOpenProfile={openProfile}
            />
          )
        }
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Search tab
// ---------------------------------------------------------------------------
function SearchTab({ navigation }: { navigation: Nav }) {
  const state = useGameStore((s) => s.state);
  const searchable = useGameStore((s) => selectSearchableAccounts(s.state));
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = norm(query.trim());
    return searchable
      .map((id) => getSocialProfile(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .filter((p) => !q || norm(p.name).includes(q) || norm(p.handle).includes(q));
  }, [query, searchable]);

  if (!state) return null;

  return (
    <View style={styles.bg}>
      <View style={styles.appBar}>
        <View style={styles.searchField}>
          <Ionicons name="search" size={15} color={theme.colors.textFaint} />
          <TextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar @usuário"
            placeholderTextColor={theme.colors.textFaint}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={theme.colors.textFaint} />
            </Pressable>
          ) : null}
        </View>
      </View>
      <FlatList
        data={results}
        keyExtractor={(p) => p.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.empty}>Nenhum perfil encontrado{query ? ` para “${query.trim()}”` : ''}.</Text>}
        renderItem={({ item }) => {
          const followed = state.following.includes(item.id);
          return (
            <Pressable style={styles.resultRow} onPress={() => navigation.navigate('SocialProfile', { account: item.id })}>
              <Avatar initials={item.initials} color={item.avatarColor} url={item.avatarUrl} size={44} />
              <View style={{ flex: 1 }}>
                <Text style={styles.resultName}>{item.name}</Text>
                <Text style={styles.resultHandle}>@{item.handle}{followed ? ' · seguindo' : ''}</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={theme.colors.textFaint} />
            </Pressable>
          );
        }}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Notifications tab (persistent — keeps read ones too)
// ---------------------------------------------------------------------------
function NotificationsTab({ navigation }: { navigation: Nav }) {
  const notices = useGameStore((s) => selectSocialNotifications(s.state));

  return (
    <View style={styles.bg}>
      <View style={styles.appBar}>
        <Text style={styles.logo}>Notificações</Text>
      </View>
      <FlatList
        data={notices}
        keyExtractor={(n) => n.id}
        ListEmptyComponent={
          <View style={styles.emptyFeed}>
            <Ionicons name="notifications-off-outline" size={34} color={theme.colors.textFaint} />
            <Text style={styles.empty}>Nenhuma notificação ainda.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            style={[styles.notifRow, !item.read && styles.notifUnread]}
            onPress={() => (item.postId ? navigation.navigate('SocialPost', { postId: item.postId }) : undefined)}
          >
            <View style={styles.notifIcon}>
              <Ionicons name="aperture" size={16} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.notifTitle}>{item.title}</Text>
              {item.body ? <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text> : null}
            </View>
            <Text style={styles.notifTime}>{clock(item.at)}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Mural shell
// ---------------------------------------------------------------------------
/**
 * Mural — the in-game social network, with an Instagram-style bottom bar:
 * feed, search, + (new post), notifications and the player's profile. The top
 * of the feed keeps only the Direct icon.
 */
export function SocialScreen({ navigation }: Screen<'Social'>) {
  const state = useGameStore((s) => s.state);
  const unread = useGameStore((s) => selectUnreadSocialCount(s.state));
  const markRead = useGameStore((s) => s.markSocialNotificationsRead);
  const showDialog = useUiStore((s) => s.showDialog);
  const [tab, setTab] = useState<MuralTab>('feed');

  // Opening the bell clears the unread badge (the list still keeps them).
  useEffect(() => {
    if (tab === 'notifications') markRead();
  }, [tab, markRead]);

  if (!state) return null;
  const me = getSocialProfile('player', state.playerName);

  return (
    <View style={styles.shell}>
      <View style={{ flex: 1 }}>
        {tab === 'feed' ? (
          <FeedTab navigation={navigation} onDirect={() => showDialog('Mensagens diretas indisponíveis na sua região.')} onGoProfile={() => setTab('profile')} />
        ) : tab === 'search' ? (
          <SearchTab navigation={navigation} />
        ) : tab === 'notifications' ? (
          <NotificationsTab navigation={navigation} />
        ) : (
          <MuralProfile navigation={navigation} />
        )}
      </View>
      <MuralTabBar
        active={tab}
        onChange={setTab}
        onNewPost={() => showDialog('Publicar no Mural está indisponível na sua região.')}
        me={me ? { initials: me.initials, avatarColor: me.avatarColor, avatarUrl: me.avatarUrl } : undefined}
        unread={unread}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: '#0A0D12' },
  bg: { flex: 1, backgroundColor: '#0A0D12' },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  logo: { flex: 1, color: theme.colors.text, fontSize: 21, fontWeight: '800', letterSpacing: 0.5 },
  searchField: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 18,
    paddingHorizontal: 12,
    height: 36,
  },
  searchInput: { flex: 1, color: theme.colors.text, fontSize: 14, padding: 0 },

  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 },
  resultName: { color: theme.colors.text, fontSize: 14.5, fontWeight: '700' },
  resultHandle: { color: theme.colors.textFaint, fontSize: 12, marginTop: 1 },

  stories: {
    flexDirection: 'row',
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  story: { alignItems: 'center', width: 62 },
  storyRing: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  storyInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0A0D12', alignItems: 'center', justifyContent: 'center' },
  storyRingIdle: { width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center' },
  storyRingSeen: { borderColor: theme.colors.textFaint },
  storyName: { color: theme.colors.textDim, fontSize: 10.5, marginTop: 4 },

  empty: { color: theme.colors.textFaint, textAlign: 'center', marginTop: 24, paddingHorizontal: 40, lineHeight: 20 },
  emptyFeed: { alignItems: 'center', marginTop: 50, gap: 6 },

  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  notifUnread: { backgroundColor: 'rgba(91,214,192,0.06)' },
  notifIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#8E5BA0', alignItems: 'center', justifyContent: 'center' },
  notifTitle: { color: theme.colors.text, fontSize: 13.5, fontWeight: '700' },
  notifBody: { color: theme.colors.textDim, fontSize: 12.5, marginTop: 1, lineHeight: 17 },
  notifTime: { color: theme.colors.textFaint, fontSize: 11 },
});
