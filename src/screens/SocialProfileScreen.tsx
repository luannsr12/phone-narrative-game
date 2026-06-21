import React from 'react';
import { View, Text, Pressable, Image, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { useGameStore, selectProfilePosts, selectStoryGroups } from '@/store/gameStore';
import { useUiStore } from '@/store/uiStore';
import { getSocialProfile } from '@/utils/social';
import { mediaUrl } from '@/utils/media';
import type { Screen } from '@/navigation/types';

/** Instagram-style account profile: stats, follow button, post grid. */
export function SocialProfileScreen({ navigation, route }: Screen<'SocialProfile'>) {
  const { account } = route.params;
  const state = useGameStore((s) => s.state);
  const posts = useGameStore((s) => selectProfilePosts(s.state, account));
  const storyGroups = useGameStore((s) => selectStoryGroups(s.state));
  const toggleFollow = useGameStore((s) => s.toggleFollow);
  const showDialog = useUiStore((s) => s.showDialog);
  const { width } = useWindowDimensions();

  const profile = getSocialProfile(account, state?.playerName, state?.followStats[account]);
  if (!state || !profile) return null;

  const followed = state.following.includes(account);
  const storyGroup = storyGroups.find((g) => g.author === account);
  const cell = (width - 4) / 3;

  return (
    <View style={styles.bg}>
      {/* App bar */}
      <View style={styles.appBar}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </Pressable>
        <Text style={styles.handle}>@{profile.handle}</Text>
        <Pressable onPress={() => showDialog('Não foi possível abrir as opções do perfil.')} hitSlop={8}>
          <Ionicons name="ellipsis-vertical" size={17} color={theme.colors.textDim} />
        </Pressable>
      </View>

      <ScrollView>
        {/* Header: avatar (story ring when available) + stats */}
        <View style={styles.head}>
          {storyGroup ? (
            <Pressable onPress={() => navigation.navigate('StoryViewer', { author: account })}>
              {storyGroup.seen ? (
                <View style={[styles.ringIdle]}>
                  <Avatar initials={profile.initials} color={profile.avatarColor} url={profile.avatarUrl} size={76} />
                </View>
              ) : (
                <LinearGradient
                  colors={['#E4C56C', '#C46CB8', '#6C8AE4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.ring}
                >
                  <View style={styles.ringInner}>
                    <Avatar initials={profile.initials} color={profile.avatarColor} url={profile.avatarUrl} size={74} />
                  </View>
                </LinearGradient>
              )}
            </Pressable>
          ) : (
            <Avatar initials={profile.initials} color={profile.avatarColor} url={profile.avatarUrl} size={82} />
          )}

          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{posts.length}</Text>
              <Text style={styles.statLabel}>publicações</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile.followers + (followed ? 1 : 0)}</Text>
              <Text style={styles.statLabel}>seguidores</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{profile.following}</Text>
              <Text style={styles.statLabel}>seguindo</Text>
            </View>
          </View>
        </View>

        <View style={styles.bioWrap}>
          <Text style={styles.name}>{profile.name}</Text>
          <Text style={styles.bio}>{profile.bio}</Text>
        </View>

        {/* Follow / message row */}
        <View style={styles.btnRow}>
          <Pressable
            style={[styles.followBtn, followed && styles.followingBtn]}
            onPress={() => toggleFollow(account)}
          >
            <Text style={[styles.followText, followed && styles.followingText]}>
              {followed ? 'Seguindo' : 'Seguir'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.followBtn, styles.followingBtn]}
            onPress={() => showDialog('Mensagens diretas indisponíveis na sua região.')}
          >
            <Text style={[styles.followText, styles.followingText]}>Mensagem</Text>
          </Pressable>
        </View>

        {/* Post grid */}
        <View style={styles.gridHead}>
          <Ionicons name="grid-outline" size={17} color={theme.colors.text} />
        </View>
        {posts.length === 0 ? (
          <Text style={styles.emptyGrid}>Nenhuma publicação ainda.</Text>
        ) : (
          <View style={styles.grid}>
            {posts.map((p) => (
              <Pressable key={p.id} onPress={() => navigation.navigate('SocialPost', { postId: p.id })}>
                {mediaUrl(p.imageMedia, p.imageUrl) ? (
                  <Image source={{ uri: mediaUrl(p.imageMedia, p.imageUrl) }} style={{ width: cell, height: cell, margin: 0.7 }} />
                ) : (
                  <View style={[styles.textTile, { width: cell, height: cell, margin: 0.7 }]}>
                    <Text style={styles.textTileText} numberOfLines={4}>
                      {p.caption}
                    </Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}
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
    paddingVertical: 10,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  handle: { color: theme.colors.text, fontSize: 16, fontWeight: '800' },

  head: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 18 },
  ring: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center' },
  ringInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0A0D12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringIdle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 1.5,
    borderColor: theme.colors.textFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-evenly' },
  stat: { alignItems: 'center' },
  statNum: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
  statLabel: { color: theme.colors.textDim, fontSize: 12 },

  bioWrap: { paddingHorizontal: 16 },
  name: { color: theme.colors.text, fontSize: 14.5, fontWeight: '700' },
  bio: { color: theme.colors.textDim, fontSize: 13.5, lineHeight: 19, marginTop: 3 },

  btnRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 14, marginBottom: 6 },
  followBtn: {
    flex: 1,
    backgroundColor: '#3797EF',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  followingBtn: { backgroundColor: theme.colors.surfaceHigh },
  followText: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '700' },
  followingText: { color: theme.colors.text },

  gridHead: {
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    marginTop: 8,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  textTile: {
    backgroundColor: theme.colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  textTileText: { color: theme.colors.textDim, fontSize: 11, textAlign: 'center', lineHeight: 15 },
  emptyGrid: { color: theme.colors.textFaint, textAlign: 'center', marginTop: 30 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 14,
  },
  modalCard: {
    backgroundColor: '#0A0D12',
    borderRadius: 16,
    overflow: 'hidden',
    maxHeight: '82%',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
});
