import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { Gender } from '@/types/game';

export type RootStackParamList = {
  Lock: undefined;
  Name: undefined;
  /** Contact-backup restore, shown right after line activation (before Home). */
  Restore: { name: string; gender: Gender };
  Home: undefined;
  Messages: undefined;
  NewChat: undefined;
  Chat: { threadId: string };
  Contacts: undefined;
  ContactProfile: { characterId: string };
  Profile: undefined;
  Files: undefined;
  FileDetail: { evidenceId: string };
  Gallery: undefined;
  Calls: undefined;
  /** Outgoing (fake) call screen from the Telefone dialer. */
  Dialing: { contact?: string; number: string };
  Timeline: undefined;
  News: undefined;
  Social: undefined;
  SocialProfile: { account: string };
  /** A single Mural post on its own screen. */
  SocialPost: { postId: string };
  StoryViewer: { author: string };
  /** The player's Blog app: list of drafts (pautas) + published matérias. */
  Blog: undefined;
  /** Compose a Blog draft: pick a narrative content option to preview. */
  BlogCompose: { blogId: string };
  /** Preview a Blog draft as it will read once published, then publish it. */
  BlogPreview: { blogId: string; optionId: string };
  /** Read a published Blog matéria and share it to a Mural story. */
  BlogDetail: { blogId: string };
  MemoryGame: undefined;
  /**
   * newsId opens the browser straight on that article's fictional site;
   * page renders an authored fictional web page (links sent in chat).
   */
  Browser: { newsId?: string; page?: { url: string; title?: string; body?: string; image?: string } } | undefined;
  Bank: undefined;
  Settings: undefined;
};

export type Screen<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;
