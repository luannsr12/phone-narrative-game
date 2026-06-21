import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, Image, Platform, ToastAndroid, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import { theme } from '@/theme';
import { clock, duration } from '@/utils/format';
import { mediaUrl } from '@/utils/media';
import { story } from '@/story';
import { parseRichText, type LinkTarget } from '@/utils/links';
import { AudioMessage } from './AudioMessage';
import { Avatar } from './Avatar';
import type { ChatEntry } from '@/types/game';
import type { Attachment } from '@/types/story';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  entry: ChatEntry;
  /** Resolved display name of the sender (may be an unsaved phone number). */
  senderName?: string;
  onAttachmentPress?: (evidenceId: string) => void;
  /** Fictional links open in the IN-GAME browser, never the real one. */
  onLinkPress?: (attachment: Attachment) => void;
  /** Inline {{page/news/post/profile}} link tapped inside the message text. */
  onOpenLink?: (target: LinkTarget) => void;
  /** Tapping a shared contact card opens that character's chat. */
  onContactPress?: (characterId: string) => void;
}

/**
 * Render message text, turning inline link tokens ({{page:…}}, {{news:…}},
 * {{post:…}}, {{profile:…}}) into tappable links that open the in-game browser
 * or Mural. Plain text is shown as-is; a message with no token is one run.
 */
function MessageText({ text, onOpenLink }: { text: string; onOpenLink?: (t: LinkTarget) => void }) {
  const segments = parseRichText(text, story);
  return (
    <Text style={styles.text}>
      {segments.map((seg, i) =>
        'link' in seg ? (
          <Text key={i} style={styles.inlineLink} onPress={() => onOpenLink?.(seg.link)}>
            {seg.label}
          </Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        ),
      )}
    </Text>
  );
}

const ATTACH_ICON: Record<Attachment['kind'], IconName> = {
  image: 'image',
  audio: 'play-circle',
  video: 'videocam',
  document: 'document-text',
  location: 'location',
  link: 'globe-outline',
  contact: 'person',
};

/** Primary line of a file-style row — the noun ("what it is"). */
const ATTACH_TITLE: Record<Attachment['kind'], string> = {
  image: 'Foto',
  audio: 'Mensagem de voz',
  video: 'Vídeo',
  document: 'Documento',
  location: 'Localização',
  link: 'Link',
  contact: 'Contato',
};

/** Secondary line — the action hint ("what tapping does"). */
const ATTACH_HINT: Record<Attachment['kind'], string> = {
  image: 'Toque para ver',
  audio: 'Mensagem de voz',
  video: 'Toque para assistir',
  document: 'Toque para abrir',
  location: 'Localização',
  link: 'Toque para abrir o link',
  contact: 'Cartão de contato',
};

/** Messages younger than this slide in; history renders static. */
const FRESH_MS = 1800;

/** Long-press: copy the bubble text (account numbers, addresses…). */
function copyText(text?: string) {
  if (!text) return;
  void Clipboard.setStringAsync(text);
  if (Platform.OS === 'android') ToastAndroid.show('Mensagem copiada', ToastAndroid.SHORT);
}

/** Open like a messenger: case file first, in-game link page, else the URL. */
function openAttachment(
  a: Attachment,
  onEvidence?: (id: string) => void,
  onLink?: (a: Attachment) => void,
) {
  if (a.kind === 'link' && onLink) {
    onLink(a);
    return;
  }
  if (a.evidence && onEvidence) {
    onEvidence(a.evidence);
    return;
  }
  const url = mediaUrl(a.media, a.url);
  if (url) void WebBrowser.openBrowserAsync(url);
}

function AttachmentView({
  attachment,
  onEvidence,
  onLink,
  onContact,
}: {
  attachment: Attachment;
  onEvidence?: (id: string) => void;
  onLink?: (a: Attachment) => void;
  onContact?: (characterId: string) => void;
}) {
  // Shared contact card — like a forwarded number; tap opens that chat.
  if (attachment.kind === 'contact' && attachment.character) {
    const c = story.characters[attachment.character];
    return (
      <Pressable onPress={() => onContact?.(attachment.character!)} style={styles.contactCard}>
        <View style={styles.contactTop}>
          <Avatar initials={c?.initials ?? '?'} color={c?.avatarColor} url={mediaUrl(c?.avatarMedia, c?.avatarUrl)} size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactName} numberOfLines={1}>
              {c?.name ?? attachment.label ?? 'Contato'}
            </Text>
            <Text style={styles.contactHint} numberOfLines={1}>
              Cartão de contato
            </Text>
          </View>
        </View>
        <View style={styles.contactAction}>
          <Ionicons name="chatbubble-ellipses-outline" size={14} color="#8AB4F8" />
          <Text style={styles.contactActionText}>Conversar</Text>
        </View>
      </Pressable>
    );
  }

  // Link preview card — messenger style, opens the in-game browser.
  if (attachment.kind === 'link') {
    return (
      <Pressable onPress={() => onLink?.(attachment)} style={styles.linkCard}>
        <View style={styles.linkIconWrap}>
          <Ionicons name="globe-outline" size={18} color="#8AB4F8" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.linkTitle} numberOfLines={2}>
            {attachment.label ?? 'Link'}
          </Text>
          {attachment.url ? (
            <Text style={styles.linkUrl} numberOfLines={1}>
              {attachment.url}
            </Text>
          ) : null}
        </View>
      </Pressable>
    );
  }

  // Playable voice message — inline player + "transcrever".
  const audioSrc = mediaUrl(attachment.media, attachment.url);
  if (attachment.kind === 'audio' && audioSrc) {
    return (
      <View>
        <AudioMessage
          url={audioSrc}
          durationSec={attachment.durationSec}
          transcript={attachment.transcript}
        />
        {attachment.evidence ? (
          <Pressable style={styles.evidenceLink} onPress={() => onEvidence?.(attachment.evidence!)}>
            <Ionicons name="folder-open-outline" size={12} color={theme.colors.textDim} />
            <Text style={styles.evidenceLinkText}>salvo nos Arquivos do Caso</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  // Inline photo preview.
  const imageSrc = mediaUrl(attachment.media, attachment.url);
  if (attachment.kind === 'image' && imageSrc) {
    return (
      <Pressable onPress={() => openAttachment(attachment, onEvidence, onLink)}>
        <Image source={{ uri: imageSrc }} style={styles.attachImage} />
        {attachment.label ? (
          <Text style={styles.imageCaption} numberOfLines={1}>
            {attachment.label}
          </Text>
        ) : null}
      </Pressable>
    );
  }

  // Video / document / location / url-less audio — file-style row.
  return (
    <Pressable onPress={() => openAttachment(attachment, onEvidence, onLink)} style={styles.attachment}>
      <View style={styles.attachIconWrap}>
        <Ionicons name={ATTACH_ICON[attachment.kind] ?? 'document'} size={20} color="#DDE5EF" />
      </View>
      <View style={styles.attachBody}>
        <Text style={styles.attachLabel} numberOfLines={1}>
          {attachment.label ?? ATTACH_TITLE[attachment.kind]}
        </Text>
        <Text style={styles.attachHint} numberOfLines={1}>
          {attachment.durationSec ? duration(attachment.durationSec) : ATTACH_HINT[attachment.kind]}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={theme.colors.textFaint} />
    </Pressable>
  );
}

export function ChatBubble({ entry, senderName, onAttachmentPress, onLinkPress, onOpenLink, onContactPress }: Props) {
  const fresh = Date.now() - entry.at < FRESH_MS;
  const anim = useRef(new Animated.Value(fresh ? 0 : 1)).current;

  useEffect(() => {
    if (fresh) {
      Animated.spring(anim, { toValue: 1, speed: 18, bounciness: 6, useNativeDriver: true }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrance = {
    opacity: anim,
    transform: [
      { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
      { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.97, 1] }) },
    ],
  };

  if (entry.kind === 'system') {
    return (
      <Animated.View style={[styles.systemWrap, entrance]}>
        <Text style={styles.systemText}>{entry.text}</Text>
      </Animated.View>
    );
  }

  if (entry.kind === 'call-log') {
    return (
      <Animated.View style={[styles.systemWrap, entrance]}>
        <View style={styles.callRow}>
          <MaterialCommunityIcons name="phone-missed" size={13} color={theme.colors.warning} />
          <Text style={styles.callLog}>Chamada perdida — {senderName}</Text>
        </View>
        {entry.text ? <Text style={styles.voicemail}>“{entry.text}”</Text> : null}
      </Animated.View>
    );
  }

  const isPlayer = entry.kind === 'player';

  return (
    <Animated.View style={[styles.row, isPlayer ? styles.rowRight : styles.rowLeft, entrance]}>
      <Pressable
        style={[styles.bubble, isPlayer ? styles.bubbleOut : styles.bubbleIn]}
        onLongPress={() => copyText(entry.text)}
        delayLongPress={350}
      >
        {entry.text ? <MessageText text={entry.text} onOpenLink={onOpenLink} /> : null}

        {entry.attachment ? (
          <AttachmentView
            attachment={entry.attachment}
            onEvidence={onAttachmentPress}
            onLink={onLinkPress}
            onContact={onContactPress}
          />
        ) : null}

        <View style={styles.metaRow}>
          <Text style={[styles.time, isPlayer ? styles.timeOut : styles.timeIn]}>
            {clock(entry.at)}
          </Text>
          {isPlayer ? <Ionicons name="checkmark-done" size={13} color="#6EC6E8" /> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 12, marginVertical: 3, flexDirection: 'row' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleIn: { backgroundColor: theme.colors.bubbleIn, borderTopLeftRadius: 4 },
  bubbleOut: { backgroundColor: theme.colors.bubbleOut, borderTopRightRadius: 4 },
  text: { color: theme.colors.text, fontSize: 15, lineHeight: 21 },
  inlineLink: { color: '#8AB4F8', textDecorationLine: 'underline' },
  metaRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 3, marginTop: 4 },
  time: { fontSize: 10 },
  timeIn: { color: theme.colors.textFaint },
  timeOut: { color: 'rgba(231,236,243,0.6)' },

  attachment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    // Without a definite width the flex:1 body collapses and the hint wraps
    // character-by-character next to the icons — this keeps the row readable.
    minWidth: 200,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: theme.radius.sm,
    padding: 8,
  },
  attachBody: { flex: 1, minWidth: 0 },
  attachIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachLabel: { color: theme.colors.text, fontSize: 13, fontWeight: '600' },
  attachHint: { color: theme.colors.textDim, fontSize: 11, marginTop: 2 },
  attachImage: {
    width: 220,
    height: 160,
    borderRadius: theme.radius.sm,
    marginTop: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  imageCaption: { color: theme.colors.textDim, fontSize: 11, marginTop: 4 },
  evidenceLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  evidenceLinkText: { color: theme.colors.textDim, fontSize: 11 },

  linkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: theme.radius.sm,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#8AB4F8',
  },
  linkIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(138,180,248,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  linkTitle: { color: '#8AB4F8', fontSize: 13.5, fontWeight: '600' },
  linkUrl: { color: theme.colors.textFaint, fontSize: 11, marginTop: 2 },

  contactCard: {
    marginTop: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: theme.radius.sm,
    overflow: 'hidden',
    minWidth: 210,
  },
  contactTop: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10 },
  contactName: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  contactHint: { color: theme.colors.textDim, fontSize: 11, marginTop: 2 },
  contactAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  contactActionText: { color: '#8AB4F8', fontSize: 13, fontWeight: '600' },

  systemWrap: { alignItems: 'center', marginVertical: 10, paddingHorizontal: 24 },
  systemText: { color: theme.colors.textDim, fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
  callRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  callLog: { color: theme.colors.warning, fontSize: 13 },
  voicemail: { color: theme.colors.textDim, fontSize: 12, fontStyle: 'italic', marginTop: 4, textAlign: 'center' },
});
