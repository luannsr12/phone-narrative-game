import { story } from '@/story';
import type { SocialPost } from '@/types/story';
import type { RuntimeComment } from '@/types/game';
import { mediaUrl } from './media';

/** Unified Mural account view — the player, a case character or a filler NPC. */
export interface SocialProfile {
  id: string;
  name: string;
  handle: string;
  initials: string;
  avatarColor: string;
  avatarUrl?: string;
  bio: string;
  /** Displayed follower / following counts (admin-defined, else a fake). */
  followers: number;
  following: number;
  isNpc: boolean;
  /** True for the player's own account (author id 'player'). */
  isPlayer: boolean;
}

const PLAYER_DEFAULT_COLOR = '#3A6EA5';

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase() || '?';

/**
 * Resolve a Mural account id to a display profile. Pass `playerName` so the
 * player's own account ('player') shows their chosen name; the journalist bio
 * and handle come from `story.playerProfile`.
 */
export function getSocialProfile(
  id: string,
  playerName?: string,
  /** Runtime override of followers/following (the `setFollowStats` effect). */
  followOverride?: { followers?: number; following?: number },
): SocialProfile | undefined {
  const fake = fakeFollowStats(id);
  const followers = (authored?: number) => followOverride?.followers ?? authored ?? fake.followers;
  const following = (authored?: number) => followOverride?.following ?? authored ?? fake.following;
  if (id === 'player') {
    const p = story.playerProfile;
    const name = (p?.name || playerName || 'Você').trim() || 'Você';
    return {
      id: 'player',
      name,
      handle: p?.handle || 'voce',
      initials: initialsOf(name),
      avatarColor: p?.avatarColor || PLAYER_DEFAULT_COLOR,
      avatarUrl: mediaUrl(p?.avatarMedia, p?.avatarUrl),
      bio: p?.bio || '',
      followers: followers(p?.followers),
      following: following(p?.following),
      isNpc: false,
      isPlayer: true,
    };
  }
  const c = story.characters[id];
  if (c) {
    // The Mural identity is DELIBERATELY separate from the chat one: photo, bio
    // and counts come from `c.social` (the social photo falls back to the chat
    // photo only when no social one is set).
    const s = c.social;
    return {
      id,
      name: c.name,
      handle: s?.handle || id,
      initials: c.initials,
      avatarColor: s?.avatarColor || c.avatarColor,
      avatarUrl: mediaUrl(s?.avatarMedia, s?.avatarUrl) ?? mediaUrl(c.avatarMedia, c.avatarUrl),
      bio: s?.bio ?? c.bio,
      followers: followers(s?.followers),
      following: following(s?.following),
      isNpc: false,
      isPlayer: false,
    };
  }
  const n = story.socialNpcs[id];
  if (n) {
    return {
      id,
      name: n.name,
      handle: id,
      initials: initialsOf(n.name),
      avatarColor: n.avatarColor,
      avatarUrl: n.avatarUrl,
      bio: n.bio,
      followers: followers(),
      following: following(),
      isNpc: true,
      isPlayer: false,
    };
  }
  return undefined;
}

/** A comment ready to render in the drawer: stable id, author, threading. */
export interface ResolvedComment {
  id: string;
  author: string;
  text: string;
  /** Authored baseline likes (the player's like adds +1). */
  baseLikes: number;
  /** Parent comment id when this is a reply. */
  replyTo?: string;
  isPlayer: boolean;
}

/**
 * Merge a post's authored comments with the player's runtime comments into one
 * list with stable ids (authored comments without an id get a deterministic
 * one). Used by the comments drawer for likes, replies and threading.
 */
export function resolveComments(
  post: SocialPost,
  runtime: RuntimeComment[] | undefined,
): ResolvedComment[] {
  const authored: ResolvedComment[] = post.comments.map((c, i) => ({
    id: c.id ?? `${post.id}#a${i}`,
    author: c.author,
    text: c.text,
    baseLikes: c.likes ?? 0,
    replyTo: c.replyTo,
    isPlayer: c.author === 'player',
  }));
  const added: ResolvedComment[] = (runtime ?? []).map((c) => ({
    id: c.id,
    author: c.author,
    text: c.text,
    baseLikes: c.likes ?? 0,
    replyTo: c.replyTo,
    isPlayer: c.author === 'player',
  }));
  return [...authored, ...added];
}

/** Deterministic fake follower/following counts so profiles feel inhabited. */
export function fakeFollowStats(id: string): { followers: number; following: number } {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return {
    followers: 60 + (h % 840),
    following: 40 + ((h >> 7) % 360),
  };
}
