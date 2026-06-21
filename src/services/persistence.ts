import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { GameState } from '@/types/game';
import { SAVE_VERSION } from './storyEngine';

const SAVE_KEY = 'sinal-perdido/save/v1';

/**
 * Saving serializes the WHOLE GameState — and the save grows with every
 * delivered message, so stringifying on every mutation makes the game
 * progressively laggier. Writes are therefore coalesced: mutations only stamp
 * the latest snapshot, and one timer flushes it shortly after.
 */
const SAVE_DEBOUNCE_MS = 1200;
let pendingSave: GameState | null = null;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function flushSave(): void {
  if (saveTimer) {
    clearTimeout(saveTimer);
    saveTimer = null;
  }
  const snapshot = pendingSave;
  pendingSave = null;
  if (!snapshot) return;
  AsyncStorage.setItem(SAVE_KEY, JSON.stringify(snapshot)).catch(() => {
    // Persistence is best-effort; a failed write must never break play.
  });
}

// Going to background may be the last chance before the OS kills the app —
// flush whatever is waiting so no progress is lost.
AppState.addEventListener('change', (s) => {
  if (s !== 'active') flushSave();
});

export async function loadSave(): Promise<GameState | null> {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GameState;
    if (parsed.version !== SAVE_VERSION) {
      // No backwards migrations yet — discard incompatible saves.
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function persistSave(state: GameState): void {
  pendingSave = state;
  if (saveTimer) return; // a flush is already scheduled; it takes the latest
  saveTimer = setTimeout(flushSave, SAVE_DEBOUNCE_MS);
}

export async function clearSave(): Promise<void> {
  // A pending snapshot would resurrect the save right after the wipe.
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  pendingSave = null;
  try {
    await AsyncStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}
