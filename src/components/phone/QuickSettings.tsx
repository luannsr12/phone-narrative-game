import React, { useEffect, useRef } from 'react';
import { View, Text, Pressable, Animated, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useUiStore, activeNotices, type ShadeNotice } from '@/store/uiStore';
import { useGameStore } from '@/store/gameStore';
import { navigationRef } from '@/navigation/navigationRef';
import { clock } from '@/utils/format';
import { APP_META, noticeMeta } from './NotificationBanner';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Tile {
  key: string;
  icon: IconName;
  label: string;
  sub?: string;
  active: boolean;
  onPress: () => void;
}

/**
 * Android-style quick settings sheet, pulled from the status bar. Wi-Fi and
 * airplane mode REALLY pause the story (no messages arrive offline) and mute
 * gates vibration; everything a phone can't do here answers with a believable
 * system error dialog.
 */
export function QuickSettings() {
  const ui = useUiStore();
  const threads = useGameStore((s) => s.state?.threads);
  const slide = useRef(new Animated.Value(-420)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: ui.quickOpen ? 0 : -420,
      useNativeDriver: true,
      bounciness: 3,
      speed: 16,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ui.quickOpen]);

  if (!ui.quickOpen) {
    // Keep mounted only while open (slide-out finishes before unmount is
    // imperceptible at this speed; simplicity wins).
    return null;
  }

  const tiles: Tile[] = [
    {
      key: 'wifi',
      icon: 'wifi',
      label: 'Wi-Fi',
      sub: ui.airplane ? 'Modo avião' : ui.wifi ? 'Salitre_5G' : 'Desativado',
      active: ui.wifi && !ui.airplane,
      onPress: () => (ui.airplane ? ui.showDialog('Desative o modo avião para usar o Wi-Fi.') : ui.toggleWifi()),
    },
    {
      key: 'airplane',
      icon: 'airplane',
      label: 'Modo avião',
      active: ui.airplane,
      onPress: ui.toggleAirplane,
    },
    {
      key: 'mute',
      icon: ui.mute ? 'volume-mute' : 'volume-high',
      label: ui.mute ? 'Sem som' : 'Som',
      active: ui.mute,
      onPress: ui.toggleMute,
    },
    {
      key: 'flash',
      icon: 'flashlight',
      label: 'Lanterna',
      active: false,
      onPress: () => ui.showDialog('Não foi possível acessar a lanterna.'),
    },
    {
      key: 'bt',
      icon: 'bluetooth',
      label: 'Bluetooth',
      active: false,
      onPress: () => ui.showDialog('Não foi possível ativar o Bluetooth.'),
    },
    {
      key: 'loc',
      icon: 'location',
      label: 'Localização',
      active: false,
      onPress: () => ui.showDialog('Não foi possível ativar a localização.'),
    },
    {
      key: 'cam',
      icon: 'camera',
      label: 'Câmera',
      active: false,
      onPress: () => ui.showDialog('Não foi possível abrir a câmera.'),
    },
    {
      key: 'dark',
      icon: 'moon',
      label: 'Modo escuro',
      active: true,
      onPress: () => ui.showDialog('O modo escuro já está ativo.'),
    },
  ];

  const notices = activeNotices(ui.inbox, threads);

  // Same deep-link priority as the heads-up banner.
  const openNotice = (n: ShadeNotice) => {
    ui.dismissNotice(n.id);
    ui.closeQuick();
    if (n.url) {
      void WebBrowser.openBrowserAsync(n.url);
      return;
    }
    if (!navigationRef.isReady()) return;
    if (n.newsId) {
      navigationRef.navigate('Browser', { newsId: n.newsId });
    } else if (n.postId) {
      navigationRef.navigate('SocialPost', { postId: n.postId });
    } else if (n.app === 'messages' && n.threadId) {
      navigationRef.navigate('Chat', { threadId: n.threadId });
    } else if (n.app !== 'custom') {
      navigationRef.navigate(APP_META[n.app].route as never);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* dim backdrop — tap to close */}
      <Pressable style={styles.backdrop} onPress={ui.closeQuick} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slide }] }]}>
        <View style={styles.head}>
          <Text style={styles.time}>{clock(Date.now())}</Text>
          <Text style={styles.carrier}>Maravox</Text>
        </View>

        <View style={styles.grid}>
          {tiles.map((t) => (
            <Pressable key={t.key} style={styles.tile} onPress={t.onPress}>
              <View style={[styles.tileIcon, t.active && styles.tileIconActive]}>
                <Ionicons name={t.icon} size={19} color={t.active ? '#06231F' : '#C9D2DF'} />
              </View>
              <Text style={styles.tileLabel} numberOfLines={1}>
                {t.label}
              </Text>
              {t.sub ? (
                <Text style={styles.tileSub} numberOfLines={1}>
                  {t.sub}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>

        <View style={styles.notifHead}>
          <Text style={styles.notifHeading}>Notificações</Text>
          {notices.length ? (
            <Pressable hitSlop={8} onPress={ui.clearInbox}>
              <Text style={styles.notifClear}>Limpar tudo</Text>
            </Pressable>
          ) : null}
        </View>
        {notices.length === 0 ? (
          <Text style={styles.notifEmpty}>Sem notificações novas</Text>
        ) : (
          <ScrollView style={styles.notifList} showsVerticalScrollIndicator={false}>
            {notices.map((n) => {
              const meta = noticeMeta(n);
              return (
                <Pressable key={n.id} style={styles.notif} onPress={() => openNotice(n)}>
                  <View style={[styles.notifIcon, { backgroundColor: meta.color }]}>
                    <Ionicons name={meta.icon} size={10} color="#fff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.notifTop}>
                      <Text style={styles.notifApp} numberOfLines={1}>
                        {meta.label}
                      </Text>
                      <Text style={styles.notifWhen}>{clock(n.at)}</Text>
                    </View>
                    <Text style={styles.notifTitle} numberOfLines={1}>
                      {n.title}
                    </Text>
                    {n.body ? (
                      <Text style={styles.notifBody} numberOfLines={2}>
                        {n.body}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.foot}>
          <Pressable
            hitSlop={8}
            onPress={() => {
              ui.closeQuick();
              if (navigationRef.isReady()) navigationRef.navigate('Settings' as never);
            }}
          >
            <Ionicons name="settings-outline" size={18} color="#94A0B3" />
          </Pressable>
          <View style={styles.handle} />
          <Pressable hitSlop={8} onPress={() => ui.showDialog('Edição de blocos indisponível.')}>
            <Ionicons name="create-outline" size={18} color="#94A0B3" />
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

/** Android-style system dialog used for "this phone can't do that" answers. */
export function SystemDialog() {
  const dialog = useUiStore((s) => s.dialog);
  const closeDialog = useUiStore((s) => s.closeDialog);
  if (!dialog) return null;

  return (
    <View style={styles.dialogWrap}>
      <Pressable style={styles.backdrop} onPress={closeDialog} />
      <View style={styles.dialog}>
        <View style={styles.dialogIcon}>
          <Ionicons name="alert-circle-outline" size={22} color="#E5B567" />
        </View>
        <Text style={styles.dialogText}>{dialog}</Text>
        <Pressable style={styles.dialogBtn} onPress={closeDialog} hitSlop={6}>
          <Text style={styles.dialogBtnText}>OK</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    maxHeight: '94%',
    backgroundColor: '#10141D',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A3242',
    elevation: 12,
  },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  time: { color: '#E7ECF3', fontSize: 16, fontWeight: '600' },
  carrier: { color: '#5C6678', fontSize: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  tile: { width: '25%', alignItems: 'center', marginBottom: 16 },
  tileIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1C2230',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileIconActive: { backgroundColor: '#5BD6C0' },
  tileLabel: { color: '#C9D2DF', fontSize: 11, marginTop: 6 },
  tileSub: { color: '#5C6678', fontSize: 9.5, marginTop: 1 },
  foot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },

  notifHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingTop: 2,
  },
  notifHeading: { color: '#94A0B3', fontSize: 11.5, fontWeight: '700', letterSpacing: 0.8 },
  notifClear: { color: '#5BD6C0', fontSize: 11.5, fontWeight: '600' },
  notifEmpty: { color: '#5C6678', fontSize: 12, textAlign: 'center', marginBottom: 12 },
  notifList: { maxHeight: 250, marginBottom: 8 },
  notif: {
    flexDirection: 'row',
    gap: 9,
    backgroundColor: '#161C28',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 6,
  },
  notifIcon: {
    width: 18,
    height: 18,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  notifTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifApp: { color: '#94A0B3', fontSize: 10.5, fontWeight: '600', flex: 1, marginRight: 8 },
  notifWhen: { color: '#5C6678', fontSize: 10.5 },
  notifTitle: { color: '#E7ECF3', fontSize: 13, fontWeight: '700', marginTop: 1 },
  notifBody: { color: '#94A0B3', fontSize: 12, lineHeight: 16.5, marginTop: 1 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#2A3242' },

  dialogWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  dialog: {
    width: '78%',
    backgroundColor: '#1C2230',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2A3242',
    elevation: 10,
  },
  dialogIcon: { marginBottom: 10 },
  dialogText: { color: '#E7ECF3', fontSize: 14.5, lineHeight: 21, textAlign: 'center' },
  dialogBtn: { marginTop: 16, alignSelf: 'flex-end' },
  dialogBtnText: { color: '#5BD6C0', fontSize: 14, fontWeight: '700', letterSpacing: 0.5 },
});
