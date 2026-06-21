import { story } from '@/story';
import type { GameState } from '@/types/game';
import type { Character } from '@/types/story';
import { clock } from './format';
import { mediaUrl } from './media';

export function getCharacter(id: string): Character | undefined {
  return story.characters[id];
}

/** Resolved Contacts/chat profile photo for a character (media wins over link). */
export function charAvatar(ch?: Character | null): string | undefined {
  if (!ch) return undefined;
  return mediaUrl(ch.avatarMedia, ch.avatarUrl);
}

/**
 * Deterministic fake phone number for a contact id. Like a real phone,
 * unknown senders appear as a raw number until saved to the agenda.
 */
export function fakePhone(id: string): string {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  const d = (n: number) => Math.abs(h >> n) % 10;
  const ddd = 10 + (Math.abs(h) % 80);
  return `+55 ${ddd} 9${d(2)}${d(5)}${d(8)}${d(11)}-${d(14)}${d(17)}${d(20)}${d(23)}`;
}

/**
 * The phone number shown for a contact while it's still unknown: the authored
 * `phone` (set in the admin) when present, otherwise a deterministic fake.
 */
export function contactPhone(id: string): string {
  return story.characters[id]?.phone || fakePhone(id);
}

/** Player-facing name for a thread/contact, hiding identity until unlocked. */
export function displayName(state: GameState, id: string): string {
  if (id === 'player') return state.playerName;
  const c = story.characters[id];
  if (!c) return id;
  return state.unlockedContacts.includes(id) ? c.name : contactPhone(id);
}

export function isUnknown(state: GameState, id: string): boolean {
  if (id === 'player' || id === 'system') return false;
  return !state.unlockedContacts.includes(id);
}

/**
 * Reverse phone-number lookup for the dialer: the SAVED contact (in the agenda)
 * whose number matches the typed digits, so the keypad shows their name instead
 * of a raw number — exactly like a real phone. Matches when the contact's full
 * number ends with what's been typed (≥4 digits), so the name appears as the
 * player keys it in. Only unlocked contacts are considered (unknown numbers
 * stay anonymous). Returns the first match.
 */
export function findContactByNumber(state: GameState, typed: string): Character | undefined {
  const digits = typed.replace(/\D/g, '');
  if (digits.length < 4) return undefined;
  for (const id of state.unlockedContacts) {
    const c = story.characters[id];
    if (!c) continue;
    const num = contactPhone(id).replace(/\D/g, '');
    if (num && (num === digits || num.endsWith(digits))) return c;
  }
  return undefined;
}

/** The character whose authored bank account matches this typed number. */
export function findByBankAccount(account: string): Character | undefined {
  const digits = account.replace(/\D/g, '');
  if (!digits) return undefined;
  return Object.values(story.characters).find(
    (c) => c.bankAccount && c.bankAccount.replace(/\D/g, '') === digits,
  );
}

/** "Eron Moreaux" -> "E•••• M••••" — how the bank shows an account holder. */
export function maskedName(fullName: string): string {
  return fullName
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0] + '••••'.slice(0, Math.max(1, Math.min(4, w.length - 1))))
    .join(' ');
}

/** Timestamp of the character's most recent message in their own thread. */
export function lastCharacterActivity(state: GameState, id: string): number | undefined {
  const entries = state.threads[id]?.entries;
  if (!entries) return undefined;
  for (let i = entries.length - 1; i >= 0; i--) {
    if (entries[i].speaker === id) return entries[i].at;
  }
  return undefined;
}

/**
 * Pseudo-random presence for the chat header ("online" / "visto por último…").
 * Pure cosmetics with no story meaning: deterministic per character, re-rolled
 * every ~5 minutes so the world feels alive without flickering mid-read.
 * `lastActiveAt` (their latest sent message) keeps it COHERENT: someone who
 * just messaged shows online, and "last seen" never predates their message.
 */
export function presence(
  id: string,
  now: number,
  lastActiveAt?: number,
  override?: { online: boolean; at: number },
): { online: boolean; label: string } {
  // Authored presence (the setPresence effect) wins over the random heuristic —
  // narrative control over who looks reachable. "visto por último" never
  // predates the character's own last message.
  if (override) {
    if (override.online) return { online: true, label: 'online' };
    const seen = lastActiveAt && override.at < lastActiveAt ? lastActiveAt : override.at;
    return { online: false, label: `visto por último às ${clock(seen)}` };
  }

  // Messaged moments ago → still online (nobody vanishes mid-conversation).
  if (lastActiveAt && now - lastActiveAt < 5 * 60_000) {
    return { online: true, label: 'online' };
  }

  const slot = Math.floor(now / 300_000);
  const key = `${id}#${slot}`;
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  if (h % 100 < 45) return { online: true, label: 'online' };

  const minsAgo = 4 + (h % 173); // last seen up to ~3h ago
  let seen = now - minsAgo * 60_000;
  // They were obviously online when their last message went out — never claim
  // an earlier "last seen" than that.
  if (lastActiveAt && seen < lastActiveAt) seen = lastActiveAt;
  return { online: false, label: `visto por último às ${clock(seen)}` };
}
