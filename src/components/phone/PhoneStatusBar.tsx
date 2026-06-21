import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { clock } from '@/utils/format';
import { useUiStore, activeNotices } from '@/store/uiStore';
import { useGameStore } from '@/store/gameStore';
import { noticeMeta } from './NotificationBanner';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

/**
 * Fake OS status bar. The real device status bar is hidden by the app, so
 * this is the only one the player sees. Tapping/pulling it opens the quick
 * settings sheet; unread notifications park their app icons next to the
 * clock, Android-style, until read/cleared.
 */
export function PhoneStatusBar() {
  const [time, setTime] = useState(() => Date.now());
  const wifi = useUiStore((s) => s.wifi);
  const airplane = useUiStore((s) => s.airplane);
  const mute = useUiStore((s) => s.mute);
  const openQuick = useUiStore((s) => s.openQuick);
  const inbox = useUiStore((s) => s.inbox);
  const threads = useGameStore((s) => s.state?.threads);

  useEffect(() => {
    const t = setInterval(() => setTime(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  // One icon per app (custom ones by their own icon), capped like a real bar.
  const pending: { key: string; icon: IconName }[] = [];
  for (const n of activeNotices(inbox, threads)) {
    const meta = noticeMeta(n);
    const key = n.app === 'custom' ? `c:${meta.icon}` : n.app;
    if (!pending.some((i) => i.key === key)) pending.push({ key, icon: meta.icon });
    if (pending.length >= 4) break;
  }

  return (
    <Pressable style={styles.bar} onPress={openQuick}>
      <View style={styles.side}>
        <Text style={styles.time}>{clock(time)}</Text>
        {pending.length ? (
          <View style={styles.notifIcons}>
            {pending.map((i) => (
              <Ionicons key={i.key} name={i.icon} size={11} color="#C9D2DF" />
            ))}
          </View>
        ) : null}
      </View>
      <View style={[styles.side, styles.right]}>
        {mute ? <Ionicons name="volume-mute" size={12} color="#94A0B3" /> : null}
        {airplane ? (
          <Ionicons name="airplane" size={12} color="#E7ECF3" />
        ) : (
          <>
            <Text style={styles.carrier}>Maravox</Text>
            <Ionicons name="cellular" size={12} color="#E7ECF3" />
            {wifi ? <Ionicons name="wifi" size={13} color="#E7ECF3" /> : null}
          </>
        )}
        <View style={styles.battery}>
          <View style={styles.batteryFill} />
        </View>
        <View style={styles.batteryNub} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 28,
    backgroundColor: '#05070A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },
  side: { flexDirection: 'row', alignItems: 'center' },
  right: { gap: 5 },
  notifIcons: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  time: { color: '#E7ECF3', fontSize: 12.5, fontWeight: '600' },
  carrier: { color: '#94A0B3', fontSize: 10.5, marginRight: 3 },
  battery: {
    width: 19,
    height: 10,
    borderRadius: 2.5,
    borderWidth: 1,
    borderColor: '#94A0B3',
    padding: 1.5,
    marginLeft: 2,
  },
  batteryFill: { flex: 1, width: '72%', borderRadius: 1, backgroundColor: '#E7ECF3' },
  batteryNub: { width: 1.5, height: 4, borderRadius: 1, backgroundColor: '#94A0B3', marginLeft: -4 },
});
