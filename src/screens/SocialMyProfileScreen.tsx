import React from 'react';
import { View, Text, Pressable, Image, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { useGameStore, selectProfilePosts, selectPlayerStory } from '@/store/gameStore';
import { useUiStore } from '@/store/uiStore';
import { getSocialProfile } from '@/utils/social';
import { mediaUrl } from '@/utils/media';
import type { Screen } from '@/navigation/types';

type Nav = Screen<'Social'>['navigation'];

/**
 * The player's OWN Mural profile (the profile tab of the Mural app): the
 * investigative journalist's pre-existing presence. Read-only — no follow
 * button (it's you). Tapping a post opens the post screen (not a modal).
 */
export function MuralProfile({ navigation }: { navigation: Nav }) {
  const state = useGameStore((s) => s.state);
  const posts = useGameStore((s) => selectProfilePosts(s.state, 'player'));
  const playerStory = useGameStore((s) => selectPlayerStory(s.state));
  const showDialog = useUiStore((s) => s.showDialog);
  const { width } = useWindowDimensions();

  if (!state) return null;
  const profile = getSocialProfile('player', state.playerName, state.followStats.player);
  if (!profile) return null;
  const cell = (width - 4) / 3;

  return (
    <View style={styles.bg}>
      {/* Tab top bar: @handle + menu (no back — the tab bar handles nav). */}
      <View style={styles.appBar}>
        <Text style={styles.handle}>@{profile.handle}</Text>
        <Pressable onPress={() => showDialog('Não foi possível abrir as opções do perfil.')} hitSlop={8}>
          <Ionicons name="menu-outline" size={22} color={theme.colors.text} />
        </Pressable>
      </View>

      <ScrollView>
        <View style={styles.head}>
          {playerStory ? (
            <Pressable onPress={() => navigation.navigate('StoryViewer', { author: 'player' })}>
              {playerStory.seen ? (
                <View style={styles.ringIdle}>
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
              <Text style={styles.statNum}>{profile.followers}</Text>
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
          <View style={styles.roleRow}>
            <Ionicons name="newspaper-outline" size={12} color={theme.colors.accent} />
            <Text style={styles.role}>Jornalismo investigativo</Text>
          </View>
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>

        <View style={styles.btnRow}>
          <Pressable
            style={[styles.followBtn, styles.followingBtn]}
            onPress={() => showDialog('Não foi possível editar o perfil agora.')}
          >
            <Text style={[styles.followText, styles.followingText]}>Editar perfil</Text>
          </Pressable>
          <Pressable
            style={[styles.followBtn, styles.followingBtn]}
            onPress={() => showDialog('Não foi possível compartilhar o perfil.')}
          >
            <Text style={[styles.followText, styles.followingText]}>Compartilhar perfil</Text>
          </Pressable>
        </View>

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
    paddingVertical: 11,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  handle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },

  head: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 18 },
  ring: { width: 86, height: 86, borderRadius: 43, alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0A0D12', alignItems: 'center', justifyContent: 'center' },
  ringIdle: { width: 86, height: 86, borderRadius: 43, borderWidth: 1.5, borderColor: theme.colors.textFaint, alignItems: 'center', justifyContent: 'center' },
  stats: { flex: 1, flexDirection: 'row', justifyContent: 'space-evenly' },
  stat: { alignItems: 'center' },
  statNum: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
  statLabel: { color: theme.colors.textDim, fontSize: 12 },

  bioWrap: { paddingHorizontal: 16 },
  name: { color: theme.colors.text, fontSize: 14.5, fontWeight: '700' },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  role: { color: theme.colors.accent, fontSize: 12.5, fontWeight: '600' },
  bio: { color: theme.colors.textDim, fontSize: 13.5, lineHeight: 19, marginTop: 4 },

  btnRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 14, marginBottom: 6 },
  followBtn: { flex: 1, backgroundColor: '#3797EF', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
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
  textTile: { backgroundColor: theme.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', padding: 10 },
  textTileText: { color: theme.colors.textDim, fontSize: 11, textAlign: 'center', lineHeight: 15 },
  emptyGrid: { color: theme.colors.textFaint, textAlign: 'center', marginTop: 30 },
});
