/**
 * The editor's single icon vocabulary. Real vector icons (lucide-react) — never
 * emoji — so the UI reads like a finished tool. Node-type glyphs live in
 * NODE_ICON (one per StoryNode type); chrome icons are imported from
 * 'lucide-react' directly where needed.
 */
import {
  MessageSquare,
  ListChecks,
  Zap,
  GitBranch,
  Unlock,
  Contact,
  Clock,
  PenLine,
  Newspaper,
  Megaphone,
  CircleDot,
  FileText,
  Banknote,
  Bell,
  Phone,
  PhoneCall,
  PhoneOff,
  AudioLines,
  Radio,
  BellOff,
  Split,
  FlagTriangleRight,
  Heart,
  UserPlus,
  MessageCircle,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { CallStepType, NodeType } from '../types';

/** One icon per node type — the single source of truth for node glyphs. */
export const NODE_ICON: Record<NodeType, LucideIcon> = {
  message: MessageSquare,
  choice: ListChecks,
  action: Zap,
  branch: GitBranch,
  unlockMessage: Unlock,
  shareContact: Contact,
  delay: Clock,
  activity: PenLine,
  publishNews: Newspaper,
  publishPost: Megaphone,
  publishStory: CircleDot,
  offerBlog: FileText,
  socialActivity: MessageCircle,
  socialFollow: Users,
  bank: Banknote,
  notification: Bell,
  call: Phone,
  callScene: PhoneCall,
  event: Radio,
  removeEvent: BellOff,
  fork: Split,
  chapterEnd: FlagTriangleRight,
};

/** Per-subtype glyph for the EVENT node (overrides the generic Radio). */
export const EVENT_ICON: Record<string, LucideIcon> = {
  playerCall: Phone,
  likePost: Heart,
  viewNews: Newspaper,
  followProfile: UserPlus,
};

/** Per-type accent hue for a node's head tile — matches the .fnode-* left strip. */
export const NODE_ACCENT: Record<string, string> = {
  message: '#5bd6c0',
  choice: '#e4c56c',
  action: '#a06ce4',
  branch: '#6c8ae4',
  unlockMessage: '#8ac46c',
  shareContact: '#64b5f6',
  delay: '#e49a6c',
  activity: '#7fd6c0',
  publishNews: '#d6815b',
  publishPost: '#ba68c8',
  publishStory: '#f06292',
  offerBlog: '#9575cd',
  socialActivity: '#ec90b0',
  socialFollow: '#7e9cef',
  bank: '#4db6ac',
  notification: '#ffd54f',
  call: '#4fc3f7',
  callScene: '#4dd0e1',
  event: '#80cbc4',
  removeEvent: '#ff8a65',
  fork: '#6c8ae4',
  chapterEnd: '#e5687a',
};

/** One icon per CALL sub-flow step type (the nested call canvas). */
export const CALL_STEP_ICON: Record<CallStepType, LucideIcon> = {
  audio: AudioLines,
  choice: ListChecks,
  action: Zap,
  branch: GitBranch,
  delay: Clock,
  hangup: PhoneOff,
};

/** Per-type accent for a call step's head tile. */
export const CALL_STEP_ACCENT: Record<CallStepType, string> = {
  audio: '#4dd0e1',
  choice: '#e4c56c',
  action: '#a06ce4',
  branch: '#6c8ae4',
  delay: '#e49a6c',
  hangup: '#e5687a',
};

export type { LucideIcon };
