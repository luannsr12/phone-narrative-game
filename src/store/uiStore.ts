import { create } from 'zustand';

/**
 * A notification waiting in the pull-down shade. Banners are transient — when
 * one replaces another, the first would vanish into limbo; the shade keeps
 * every UNSEEN notification until it's tapped, cleared, or its thread is read.
 */
export interface ShadeNotice {
  id: string;
  app: 'messages' | 'news' | 'social' | 'bank' | 'blog' | 'custom';
  appName?: string;
  icon?: string;
  iconColor?: string;
  title: string;
  body?: string;
  at: number;
  threadId?: string;
  newsId?: string;
  postId?: string;
  url?: string;
}

/**
 * Transient phone-UI state (not persisted): quick-settings toggles and the
 * Android-style system dialog. Wi-Fi/airplane have a REAL function — when the
 * phone is offline the story playback pauses (no messages arrive) — and mute
 * gates notification vibration. Everything else surfaces a believable system
 * error popup.
 */
interface UiStore {
  quickOpen: boolean;
  wifi: boolean;
  airplane: boolean;
  mute: boolean;
  /** System dialog message; null = hidden. */
  dialog: string | null;
  /**
   * Message nodes currently in their visible "digitando…" phase — a SET, since
   * parallel fork tracks can have several threads typing at once. The playback
   * driver adds a node only AFTER a human reaction lag (nobody starts typing the
   * instant you hit send) and removes it on delivery.
   */
  typingNodeIds: string[];
  /** Unseen notifications, newest first (the pull-down shade reads this). */
  inbox: ShadeNotice[];

  openQuick: () => void;
  closeQuick: () => void;
  toggleWifi: () => void;
  toggleAirplane: () => void;
  toggleMute: () => void;
  showDialog: (msg: string) => void;
  closeDialog: () => void;
  setTyping: (id: string, on: boolean) => void;
  pushNotice: (n: ShadeNotice) => void;
  dismissNotice: (id: string) => void;
  clearInbox: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  quickOpen: false,
  wifi: true,
  airplane: false,
  mute: false,
  dialog: null,
  typingNodeIds: [],
  inbox: [],

  openQuick: () => set({ quickOpen: true }),
  closeQuick: () => set({ quickOpen: false }),
  toggleWifi: () => set((s) => ({ wifi: !s.wifi })),
  toggleAirplane: () => set((s) => ({ airplane: !s.airplane, wifi: s.airplane ? s.wifi : false })),
  toggleMute: () => set((s) => ({ mute: !s.mute })),
  showDialog: (msg) => set({ dialog: msg }),
  closeDialog: () => set({ dialog: null }),
  setTyping: (id, on) =>
    set((s) => ({
      typingNodeIds: on
        ? s.typingNodeIds.includes(id)
          ? s.typingNodeIds
          : [...s.typingNodeIds, id]
        : s.typingNodeIds.filter((x) => x !== id),
    })),
  // A newer message from the same thread replaces its older entry — one
  // shade card per conversation, like a real messenger.
  pushNotice: (n) =>
    set((s) => ({
      inbox: [
        n,
        ...s.inbox.filter((x) => x.id !== n.id && !(n.threadId && x.threadId === n.threadId)),
      ].slice(0, 20),
    })),
  dismissNotice: (id) => set((s) => ({ inbox: s.inbox.filter((x) => x.id !== id) })),
  clearInbox: () => set({ inbox: [] }),
}));

/** True when the phone can "receive" messages — gates story playback. */
export function selectOnline(s: Pick<UiStore, 'wifi' | 'airplane'>): boolean {
  return s.wifi && !s.airplane;
}

/** Only still-unread notices: message cards drop off once their thread is read. */
export function activeNotices(
  inbox: ShadeNotice[],
  threads?: Record<string, { unread: number }>,
): ShadeNotice[] {
  return inbox.filter(
    (n) => n.app !== 'messages' || !n.threadId || (threads?.[n.threadId]?.unread ?? 0) > 0,
  );
}
