/**
 * Global narrative clock.
 *
 * Mounted once at the app root. Watches the engine playhead and self-advances
 * non-blocking nodes on a timer (simulating typing), so the story keeps moving
 * regardless of which screen is open. Stops on choices/calls (await input),
 * auto-closes chapters when it reaches a `chapterEnd` — and PAUSES while the
 * phone is "offline" (Wi-Fi off / airplane mode from quick settings), which
 * is what gives those toggles a real in-game function.
 */
import React, { useEffect } from 'react';
import {
  useGameStore,
  selectCurrentNode,
  selectForkNode,
  selectChapterGateBlocked,
} from '@/store/gameStore';
import { useUiStore, selectOnline } from '@/store/uiStore';
import type { GameState } from '@/types/game';
import type { MessageNode, ShareContactNode } from '@/types/story';

/**
 * Human reaction lag BEFORE the "digitando…" phase starts. Nobody replies the
 * instant a message arrives: they notice the phone, read what you wrote, think.
 * Scales with what just happened in the thread — longest right after a player
 * message (reading time), near zero mid-burst from the same character.
 */
function reactionMsFor(node: MessageNode | ShareContactNode, state: GameState): number {
  if (node.speaker === 'player') return 200 + Math.random() * 300;
  if (node.speaker === 'system') return 400;
  const thread = state.threads[node.thread];
  const last = thread?.entries[thread.entries.length - 1];
  const r = Math.random();
  if (!last) return 900 + r * 1600; // opening a conversation
  if (last.kind === 'player') {
    // Notice + read the player's message + think before typing.
    const readMs = Math.min(2400, (last.text?.length ?? 0) * 18);
    return 1500 + readMs + r * 1400;
  }
  if (last.speaker === node.speaker) {
    // Same person continuing: tiny breath mid-burst, longer if they went quiet.
    return Date.now() - last.at > 60_000 ? 800 + r * 1200 : 250 + r * 500;
  }
  return 700 + r * 1000; // scene moved here from elsewhere
}

export function usePlaybackDriver(): void {
  const state = useGameStore((s) => s.state);
  const online = useUiStore(selectOnline);
  // Objective gate on the current chapterEnd: any state change (a Pares win,
  // a transfer, an evidence) can flip this, and the flip re-arms the effect
  // below so the chapter closes the moment the requirement is met.
  const gateBlocked = useGameStore((s) => selectChapterGateBlocked(s.state));

  // Re-run only when the playhead (or a gate/armed delay) actually moves — not
  // on every unrelated state write (e.g. marking a thread read).
  const key = state
    ? `${state.currentChapter}|${state.currentNode}|${state.endingId}|${state.justCompletedChapter}|${online}|${gateBlocked}|${state.delayUntil ?? ''}`
    : 'idle';

  useEffect(() => {
    if (!online) return;
    const { state: live, advanceOnce, closeCurrentChapter, tickDelay } = useGameStore.getState();
    if (!live || live.endingId || live.justCompletedChapter) return;

    const node = selectCurrentNode(live);
    if (!node) return;

    if (node.type === 'chapterEnd') {
      // closeCurrentChapter is a no-op while the objective gate is unmet.
      closeCurrentChapter();
      return;
    }
    if (node.type === 'choice' || node.type === 'call' || node.type === 'callScene') {
      return; // blocked: the UI (choice chips / call overlay) drives the next move
    }
    if (node.type === 'delay') {
      // Real-time wait: arm the wall-clock stamp on first sight (also catches
      // waits that elapsed while the app was closed), then sleep it out.
      const t = Date.now();
      if (live.delayUntil == null || live.delayUntil <= t) {
        tickDelay();
        return;
      }
      const timer = setTimeout(() => useGameStore.getState().tickDelay(), live.delayUntil - t + 50);
      return () => clearTimeout(timer);
    }

    if (node.type === 'message' || node.type === 'shareContact') {
      const reaction = reactionMsFor(node, live);
      const typing = node.typingMs ?? 1000;
      const isHuman = node.speaker !== 'player' && node.speaker !== 'system';
      // Phase 1 (silent): the character hasn't seen/read it yet — no indicator.
      // Phase 2: "digitando…" shows for typingMs, then the bubble lands.
      const showTimer = isHuman
        ? setTimeout(() => useUiStore.getState().setTyping(node.id, true), reaction)
        : undefined;
      const deliverTimer = setTimeout(advanceOnce, reaction + typing);
      return () => {
        if (showTimer) clearTimeout(showTimer);
        clearTimeout(deliverTimer);
        useUiStore.getState().setTyping(node.id, false);
      };
    }

    if (node.type === 'activity') {
      // Pure presence: show "digitando…/gravando…" for `seconds`, then move on
      // without delivering anything. Player/system speakers show no indicator.
      const ms = Math.max(0, node.seconds) * 1000;
      const isHuman = node.speaker !== 'player' && node.speaker !== 'system';
      if (isHuman) useUiStore.getState().setTyping(node.id, true);
      const timer = setTimeout(advanceOnce, ms);
      return () => {
        clearTimeout(timer);
        useUiStore.getState().setTyping(node.id, false);
      };
    }

    const timer = setTimeout(advanceOnce, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/**
 * Drives every PARALLEL fork track (spawned by `fork` nodes) — one isolated
 * timer per track so siblings don't reset each other's typing/delivery lag.
 * Mounted once at the root, beside usePlaybackDriver. Renders nothing.
 */
export function ForkDriver(): React.ReactElement | null {
  // A stable list of fork ids; the per-track component below owns each timer.
  const forkKey = useGameStore((s) => (s.state?.forks ?? []).map((f) => f.id).join(','));
  const online = useUiStore(selectOnline);
  if (!online || !forkKey) return null;
  return React.createElement(
    React.Fragment,
    null,
    forkKey.split(',').map((id) => React.createElement(ForkTrack, { key: id, forkId: id })),
  );
}

/** One parallel track's clock — re-arms only when THIS track's position moves. */
function ForkTrack({ forkId }: { forkId: string }): null {
  const fork = useGameStore((s) => s.state?.forks.find((f) => f.id === forkId));
  // Effect key: only this track's node / wait. Sibling advances keep the same
  // object reference for unchanged forks, so this effect won't needlessly reset.
  const key = fork ? `${fork.node ?? ''}|${fork.delayUntil ?? ''}` : 'gone';

  useEffect(() => {
    if (!fork || fork.node == null) return;
    const { state: live } = useGameStore.getState();
    if (!live || live.endingId || live.justCompletedChapter) return;
    const node = selectForkNode(live, fork);
    const step = () => useGameStore.getState().advanceForkOnce(forkId);

    // Dead end / missing, or a main-line-only node (choice/call/chapterEnd):
    // the engine prunes this track. Self-advancing nodes step immediately.
    if (!node || isForkImmediate(node.type)) {
      const t = setTimeout(step, 0);
      return () => clearTimeout(t);
    }

    if (node.type === 'message' || node.type === 'shareContact') {
      const reaction = reactionMsFor(node, live);
      const typing = node.typingMs ?? 1000;
      const isHuman = node.speaker !== 'player' && node.speaker !== 'system';
      const showTimer = isHuman
        ? setTimeout(() => useUiStore.getState().setTyping(node.id, true), reaction)
        : undefined;
      const deliver = setTimeout(step, reaction + typing);
      return () => {
        if (showTimer) clearTimeout(showTimer);
        clearTimeout(deliver);
        useUiStore.getState().setTyping(node.id, false);
      };
    }

    if (node.type === 'activity') {
      const ms = Math.max(0, node.seconds) * 1000;
      const isHuman = node.speaker !== 'player' && node.speaker !== 'system';
      if (isHuman) useUiStore.getState().setTyping(node.id, true);
      const t = setTimeout(step, ms);
      return () => {
        clearTimeout(t);
        useUiStore.getState().setTyping(node.id, false);
      };
    }

    if (node.type === 'delay') {
      const t = Date.now();
      const tick = () => useGameStore.getState().tickForkDelay(forkId);
      if (fork.delayUntil == null || fork.delayUntil <= t) {
        const timer = setTimeout(tick, 0);
        return () => clearTimeout(timer);
      }
      const timer = setTimeout(tick, fork.delayUntil - t + 50);
      return () => clearTimeout(timer);
    }

    const t = setTimeout(step, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [forkId, key]);

  return null;
}

/** Node types a fork track steps through instantly (no bubble, no wait). */
function isForkImmediate(type: string): boolean {
  return (
    type === 'action' ||
    type === 'branch' ||
    type === 'fork' ||
    type === 'event' ||
    type === 'removeEvent' ||
    type === 'publishNews' ||
    type === 'publishPost' ||
    type === 'publishStory' ||
    type === 'offerBlog' ||
    type === 'bank' ||
    type === 'notification' ||
    type === 'unlockMessage' ||
    type === 'choice' ||
    type === 'call' ||
    type === 'callScene' ||
    type === 'chapterEnd'
  );
}

/**
 * Fires the armed no-reply nudge (message `reminder`) when its time comes —
 * including on app start, if it came due while the app was closed.
 */
export function useReminderScheduler(): void {
  const at = useGameStore((s) => s.state?.pendingReminder?.at ?? null);

  useEffect(() => {
    if (at == null) return;
    const fire = () => useGameStore.getState().processReminder();
    const t = Date.now();
    if (at <= t) {
      fire();
      return;
    }
    const timer = setTimeout(fire, at - t + 50);
    return () => clearTimeout(timer);
  }, [at]);
}

/**
 * Publishes scheduled news when their delay elapses (and on app start, for
 * items that came due while the app was closed).
 */
export function useNewsScheduler(): void {
  const scheduled = useGameStore((s) => s.state?.scheduledNews ?? []);
  const sig = scheduled.map((n) => `${n.news}@${n.at}`).join(',');

  useEffect(() => {
    if (!scheduled.length) return;
    const { processDueNews } = useGameStore.getState();
    const t = Date.now();
    const nextAt = Math.min(...scheduled.map((n) => n.at));
    if (nextAt <= t) {
      processDueNews();
      return;
    }
    const timer = setTimeout(() => useGameStore.getState().processDueNews(), nextAt - t + 50);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
}
