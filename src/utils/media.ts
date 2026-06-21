/**
 * Media-library resolution.
 *
 * Audio/video carrying a `media` id (a story.media entry) play that file; a raw
 * `url` is the legacy fallback. Centralising the file in the library means the
 * same link isn't pasted loose across many nodes.
 */
import { story } from '@/story';

/** Effective playback URL for a media-ref ({ media?, url? }). media wins. */
export function mediaUrl(media?: string, url?: string): string | undefined {
  if (media) {
    const item = story.media?.[media];
    if (item?.url) return item.url;
  }
  return url || undefined;
}
