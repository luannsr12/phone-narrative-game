import React, { useMemo } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PhoneStatusBar } from './PhoneStatusBar';
import { SystemNavBar } from './SystemNavBar';
import { QuickSettings, SystemDialog } from './QuickSettings';
import { useUiStore } from '@/store/uiStore';

/** Status bar height + a forgiving strip below it where the pull still works. */
const STATUS_BAR_H = 28;
const GRAB_EXTRA = 26;

/**
 * The "device". Everything the player sees renders between a fake OS status
 * bar and a fake Android nav bar, so the whole app reads as a phone being
 * used, not as an app with screens. The real device status bar is hidden in
 * App.tsx; safe-area insets keep our bars clear of notches/gesture areas.
 *
 * The notification shade opens like on a real phone: tapping the status bar
 * OR dragging down from it — the grab zone extends a bit below the bar so
 * the gesture is easy to land.
 */
export function PhoneShell({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  const grabBottom = insets.top + STATUS_BAR_H + GRAB_EXTRA;

  // Capture-phase pan on the whole device: claims only clearly-vertical
  // downward drags that START in the top grab zone, so taps and scrolls
  // everywhere else are untouched.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponderCapture: (_e, g) =>
          !useUiStore.getState().quickOpen &&
          g.y0 <= grabBottom &&
          g.dy > 12 &&
          g.dy > Math.abs(g.dx) * 1.2,
        onPanResponderMove: (_e, g) => {
          if (g.dy > 26) useUiStore.getState().openQuick();
        },
        onPanResponderRelease: (_e, g) => {
          if (g.dy > 12) useUiStore.getState().openQuick();
        },
        onPanResponderTerminationRequest: () => true,
      }),
    [grabBottom],
  );

  return (
    <View
      style={[styles.device, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      {...pan.panHandlers}
    >
      <PhoneStatusBar />
      <View style={styles.screen}>
        {children}
        <QuickSettings />
        <SystemDialog />
      </View>
      <SystemNavBar />
    </View>
  );
}

const styles = StyleSheet.create({
  device: { flex: 1, backgroundColor: '#05070A' },
  screen: { flex: 1, overflow: 'hidden' },
});
