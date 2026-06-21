import { story } from '@/story';
import type { BlogPost } from '@/types/story';
import { mediaUrl } from './media';

/**
 * Resolved thumbnail/header image for a Blog matéria: a Media library item
 * (`imageMedia`) or direct link (`imageUrl`) wins; otherwise the chosen
 * Evidence's media (`imageEvidence`, itself media-aware). Used in the Blog app
 * and when the post surfaces in the Notícias app.
 */
export function blogImageUrl(post: BlogPost): string | undefined {
  const direct = mediaUrl(post.imageMedia, post.imageUrl);
  if (direct) return direct;
  if (post.imageEvidence) {
    const ev = story.evidence[post.imageEvidence];
    if (ev) return mediaUrl(ev.media, ev.url);
  }
  return undefined;
}

/** The player's blog/news outlet name (Blog app header + Notícias outlet). */
export function blogOutletName(): string {
  return story.meta.blogName?.trim() || 'Meu blog';
}
