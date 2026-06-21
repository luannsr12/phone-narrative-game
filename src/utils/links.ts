/**
 * Fictional links a character can drop into a chat message.
 *
 * A writer inserts a token in the message text (via the editor's `{{` menu):
 *   {{page:id}}     — an authored fictional web page (story.pages)
 *   {{news:id}}     — a news article's fictional website
 *   {{post:id}}     — a Mural post
 *   {{profile:id}}  — a Mural profile (case character / NPC / the player)
 *
 * These never resolve to plain text (see utils/template.ts leaves them alone) —
 * the chat bubble renders them as tappable links that open the IN-GAME browser
 * or Mural, never a real site. This module turns a token into a display address
 * and a navigation target.
 */

import type { NewsArticle, Story, WebPage } from '@/types/story';
import { getSocialProfile } from '@/utils/social';

export type LinkKind = 'page' | 'news' | 'post' | 'profile';

export interface LinkTarget {
  kind: LinkKind;
  id: string;
}

/** A parsed message: plain runs and tappable link runs, in order. */
export type RichSegment = { text: string } | { link: LinkTarget; label: string };

const strip = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Fictional address of a news article's website, derived from its outlet. */
export function newsSiteUrl(article: NewsArticle): string {
  const slug = strip(article.outlet).replace(/[^a-z0-9]+/g, '');
  const path = article.id.replace(/^news_/, '').replace(/_/g, '-');
  return `${slug || 'noticias'}.com.br/noticias/${path}`;
}

/** Full fictional URL of an authored web page (domain + optional path). */
export function pageUrl(page: WebPage): string {
  const domain = page.domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
  const path = (page.path ?? '').replace(/^\/+/, '');
  return path ? `${domain}/${path}` : domain;
}

/** The address shown for a link token; '' when it can't be resolved. */
export function linkLabel(target: LinkTarget, story: Story): string {
  switch (target.kind) {
    case 'page': {
      const p = story.pages?.[target.id];
      return p ? pageUrl(p) : '';
    }
    case 'news': {
      const n = story.news[target.id];
      return n ? newsSiteUrl(n) : '';
    }
    case 'post': {
      const post = story.social[target.id];
      const handle = post ? getSocialProfile(post.author)?.handle ?? post.author : target.id;
      return `mural.app/@${handle}`;
    }
    case 'profile': {
      const handle = getSocialProfile(target.id)?.handle ?? target.id;
      return `mural.app/@${handle}`;
    }
  }
}

const LINK_TOKEN = /\{\{\s*(page|news|post|profile)\s*:\s*([^{}|]+?)\s*\}\}/gi;

/**
 * Split already-interpolated message text into plain + link segments. Text vars
 * are gone by now (resolved at delivery); only link tokens remain to render.
 */
export function parseRichText(text: string, story: Story): RichSegment[] {
  if (!text.includes('{{')) return [{ text }];
  const segments: RichSegment[] = [];
  let last = 0;
  for (const m of text.matchAll(LINK_TOKEN)) {
    const at = m.index ?? 0;
    if (at > last) segments.push({ text: text.slice(last, at) });
    const kind = m[1].toLowerCase() as LinkKind;
    const id = m[2].trim();
    const target: LinkTarget = { kind, id };
    const label = linkLabel(target, story) || id;
    segments.push({ link: target, label });
    last = at + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments.length ? segments : [{ text }];
}
