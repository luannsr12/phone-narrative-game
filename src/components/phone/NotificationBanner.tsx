import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View, StyleSheet, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAudioPlayer } from 'expo-audio';
import { useGameStore, type AppNotice } from '@/store/gameStore';
import { useUiStore } from '@/store/uiStore';
import { navigationRef } from '@/navigation/navigationRef';

/** Plays for an incoming message/news when notification sound is on. */
const NOTIF_SOUND = require('../../../assets/audio/notification_message.mp3');

const SUPPRESSED_ROUTES = new Set(['Lock', 'Name']);
const SHOW_MS = 4200;

type IconName = React.ComponentProps<typeof Ionicons>['name'];

export const APP_META: Record<Exclude<AppNotice['app'], 'custom'>, { label: string; icon: IconName; color: string; route: string }> = {
  messages: { label: 'Mensagens', icon: 'chatbubble-ellipses', color: '#2E7D6B', route: 'Messages' },
  news: { label: 'Notícias', icon: 'newspaper', color: '#A0553A', route: 'News' },
  social: { label: 'Mural', icon: 'aperture', color: '#8E5BA0', route: 'Social' },
  bank: { label: 'Tulu Bank', icon: 'wallet', color: '#00796B', route: 'Bank' },
  blog: { label: 'Blog', icon: 'create', color: '#5C6BC0', route: 'Blog' },
};

/** Header meta: real app entry, or the authored look of a custom banner. */
export function noticeMeta(n: {
  app: AppNotice['app'];
  appName?: string;
  icon?: string;
  iconColor?: string;
}): { label: string; icon: IconName; color: string } {
  if (n.app !== 'custom') return APP_META[n.app];
  return {
    label: n.appName || 'Sistema',
    icon: (n.icon as IconName) || 'notifications',
    color: n.iconColor || '#5C6678',
  };
}

/**
 * Android-style heads-up notification for every in-game app: a character
 * message in another thread, a just-published news article, a new Mural post.
 * Tapping deep-links into the right app.
 */
export function NotificationBanner() {
  const notice = useGameStore((s) => s.lastNotice);
  const mute = useUiStore((s) => s.mute);
  const [shown, setShown] = useState<AppNotice | null>(null);
  const slide = useRef(new Animated.Value(-140)).current;
  const notifSound = useAudioPlayer(NOTIF_SOUND);

  // Notification chime — only for incoming MESSAGES and NEWS, only while sound
  // is on (the "Som" tile toggles `mute`). Tied to the NOTICE actually being
  // delivered (see below): the existing open-chat/open-app suppression means
  // no chime fires for a conversation the player already has open.
  const chime = () => {
    if (mute) return;
    try {
      void notifSound.seekTo(0);
      notifSound.play();
    } catch {
      /* a missing/locked audio device must never break delivery */
    }
  };

  useEffect(() => {
    if (!notice) return;
    const route = navigationRef.isReady() ? navigationRef.getCurrentRoute() : undefined;
    const routeName = route?.name ?? '';

    // Don't notify about the screen the player is already looking at.
    const params = route?.params as { threadId?: string } | undefined;
    if (notice.app === 'messages' && routeName === 'Chat' && params?.threadId === notice.threadId) return;
    if (notice.app === 'news' && routeName === 'News') return;
    if (notice.app === 'social' && routeName === 'Social') return;
    if (notice.app === 'bank' && routeName === 'Bank') return;
    if (notice.app === 'blog' && routeName === 'Blog') return;

    // Into the shade it goes — banners are transient, the shade is the memory.
    useUiStore.getState().pushNotice({
      id: notice.id,
      app: notice.app,
      appName: notice.appName,
      icon: notice.icon,
      iconColor: notice.iconColor,
      title: notice.title,
      body: notice.body,
      at: Date.now(),
      threadId: notice.threadId,
      newsId: notice.newsId,
      postId: notice.postId,
      url: notice.url,
    });

    // The notice cleared the open-chat/open-app suppression above → it really
    // is a new notification. Chime for messages/news only.
    if (notice.app === 'messages' || notice.app === 'news') chime();

    // On the lock/name screens only the shade collects it — no heads-up.
    if (SUPPRESSED_ROUTES.has(routeName)) return;

    setShown(notice);
    // Vibration is independent of the "Som" toggle: muting silences only the
    // notification sound (the mp3) — the phone still buzzes.
    Vibration.vibrate(35);
    Animated.spring(slide, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notice?.id]);

  // Auto-dismiss runs off the DISPLAYED banner, not the arrival event — a
  // suppressed newcomer can no longer cancel the visible banner's timer and
  // leave it stuck on screen.
  useEffect(() => {
    if (!shown) return;
    const timer = setTimeout(dismiss, shown.durationMs ?? SHOW_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shown?.id]);

  const dismiss = () => {
    Animated.timing(slide, { toValue: -140, duration: 180, useNativeDriver: true }).start(() =>
      setShown(null),
    );
  };

  const open = () => {
    if (!shown) return;
    dismiss();
    useUiStore.getState().dismissNotice(shown.id);
    // Authored external link: opens the REAL browser, outside the game.
    if (shown.url) {
      void WebBrowser.openBrowserAsync(shown.url);
      return;
    }
    if (!navigationRef.isReady()) return;
    if (shown.newsId) {
      navigationRef.navigate('Browser', { newsId: shown.newsId });
    } else if (shown.postId) {
      navigationRef.navigate('SocialPost', { postId: shown.postId });
    } else if (shown.app === 'messages' && shown.threadId) {
      navigationRef.navigate('Chat', { threadId: shown.threadId });
    } else if (shown.app !== 'custom') {
      navigationRef.navigate(APP_META[shown.app].route as never);
    }
    // custom with no target: tapping just dismisses.
  };

  if (!shown) return null;
  const meta = noticeMeta(shown);

  return (
    <Animated.View style={[styles.wrap, { transform: [{ translateY: slide }] }]}>
      <Pressable style={styles.card} onPress={open}>
        <View style={styles.headRow}>
          <View style={[styles.appIcon, { backgroundColor: meta.color }]}>
            <Ionicons name={meta.icon} size={9} color="#fff" />
          </View>
          <Text style={styles.appName}>{meta.label}</Text>
          <Text style={styles.dot}> · </Text>
          <Text style={styles.when}>agora</Text>
        </View>
        <Text style={styles.sender} numberOfLines={1}>
          {shown.title}
        </Text>
        <Text style={styles.preview} numberOfLines={2}>
          {shown.body}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 6, left: 8, right: 8, zIndex: 100 },
  card: {
    backgroundColor: 'rgba(24,30,42,0.97)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A3242',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  headRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  appIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  appName: { color: '#94A0B3', fontSize: 11.5, fontWeight: '600' },
  dot: { color: '#5C6678', fontSize: 11.5 },
  when: { color: '#5C6678', fontSize: 11.5 },
  sender: { color: '#E7ECF3', fontSize: 14, fontWeight: '700' },
  preview: { color: '#94A0B3', fontSize: 13, marginTop: 1, lineHeight: 18 },
});
