import type { Condition } from '@/types/story';
import type { GameState } from '@/types/game';

/**
 * Evaluate an authored Condition against the current GameState.
 * Pure and total — unknown shapes resolve to false rather than throwing,
 * so a malformed condition never crashes the playthrough.
 */
export function evalCondition(state: GameState, condition?: Condition): boolean {
  if (!condition) return true;

  switch (condition.type) {
    case 'flag': {
      const v = state.flags[condition.flag];
      const expected = condition.value ?? true;
      return Boolean(v) === expected;
    }
    case 'flagEquals':
      return state.flags[condition.flag] === condition.value;
    case 'gender':
      return state.playerGender === condition.value;
    case 'trustAtLeast':
      return (state.trust[condition.character] ?? 0) >= condition.value;
    case 'trustBelow':
      return (state.trust[condition.character] ?? 0) < condition.value;
    case 'hasEvidence':
      return state.evidence.some((e) => e.id === condition.evidence);
    case 'choseOption':
      return state.choicesMade.includes(condition.option);
    case 'chapterCompleted':
      return state.completedChapters.includes(condition.chapter);
    case 'moneyAtLeast':
      return state.money >= condition.amount;
    case 'paidAtLeast':
      return (state.transfers[condition.character] ?? 0) >= condition.amount;
    case 'likedPost':
      return state.likedPosts.includes(condition.post) === (condition.value ?? true);
    case 'likedComment':
      return state.likedComments.includes(condition.comment) === (condition.value ?? true);
    case 'viewedNews':
      return (state.viewedNews ?? []).includes(condition.news) === (condition.value ?? true);
    case 'followsProfile':
      return state.following.includes(condition.account) === (condition.value ?? true);
    case 'all':
      return condition.conditions.every((c) => evalCondition(state, c));
    case 'any':
      return condition.conditions.some((c) => evalCondition(state, c));
    case 'not':
      return !evalCondition(state, condition.condition);
    default:
      return false;
  }
}
