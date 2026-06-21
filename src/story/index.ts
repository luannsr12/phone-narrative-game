/**
 * Story assembly.
 *
 * The ENTIRE story lives in `story.json` — one bundle holding meta,
 * characters, evidence, news, endings and every chapter graph. The file is
 * produced by the visual editor in `editor/` (export button) and dropped
 * here verbatim; the game needs no code change to pick up new content.
 *
 * The bundle may carry an `_editor` key (node layout positions). The game
 * ignores it.
 */
import type { Story } from '@/types/story';

import bundle from './story.json';

// `social`/`ads` may be absent in bundles exported by older editor versions.
const raw = bundle as unknown as Story;
export const story: Story = {
  ...raw,
  social: raw.social ?? {},
  socialStories: raw.socialStories ?? {},
  socialNpcs: raw.socialNpcs ?? {},
  blog: raw.blog ?? {},
  ads: raw.ads ?? {},
};
