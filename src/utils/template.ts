/**
 * Authored-text template variables.
 *
 * Writers can use {{player_name}} / {{player_first_name}} inside any story
 * text (messages, choice labels, voicemails, call transcripts, objectives,
 * ending scenes). Unknown variables render untouched so a typo is visible in
 * playtesting instead of silently disappearing.
 *
 * Gender:
 *   {{player_gender}}          → "ele" / "ela"
 *   {{g:masculino|feminino}}   → picks by the player's chosen gender
 *
 * LINK tokens ({{page:id}}, {{news:id}}, {{post:id}}, {{profile:id}}) are
 * DELIBERATELY left untouched here — they are only ever placed in message text
 * and are rendered as tappable links by the chat bubble (see utils/richText.ts).
 * Everywhere else they simply never appear.
 */

import type { Gender } from '@/types/game';

export interface TemplateContext {
  playerName: string;
  gender?: Gender;
}

/** Token names handled as inline LINKS by the chat renderer, not as text vars. */
const LINK_KINDS = new Set(['page', 'news', 'post', 'profile']);

function toCtx(ctx: string | TemplateContext): TemplateContext {
  return typeof ctx === 'string' ? { playerName: ctx } : ctx;
}

const VARS: Record<string, (c: TemplateContext) => string> = {
  player_name: (c) => c.playerName,
  player_first_name: (c) => c.playerName.trim().split(/\s+/)[0] || c.playerName,
  player_gender: (c) => (c.gender === 'f' ? 'ela' : 'ele'),
};

export function interpolate(text: string, ctx: string | TemplateContext): string;
export function interpolate(text: string | undefined, ctx: string | TemplateContext): string | undefined;
export function interpolate(
  text: string | undefined,
  ctx: string | TemplateContext,
): string | undefined {
  if (!text || !text.includes('{{')) return text;
  const c = toCtx(ctx);
  return text.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (match, raw: string) => {
    const body = raw.trim();

    // Gendered pair: {{g:masculino|feminino}} (also accepts {{gender:a|b}}).
    const g = body.match(/^(?:g|gender)\s*:\s*(.*)$/i);
    if (g) {
      const [masc = '', fem = ''] = g[1].split('|');
      return (c.gender === 'f' ? fem : masc).trim();
    }

    // Link tokens stay verbatim — the chat renderer turns them into links.
    if (body.includes(':') && LINK_KINDS.has(body.split(':')[0].trim().toLowerCase())) {
      return match;
    }

    const resolve = VARS[body.toLowerCase()];
    return resolve ? resolve(c) : match;
  });
}
