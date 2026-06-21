import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform, AppState } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { enableFreeze } from 'react-native-screens';

import { theme } from '@/theme';
import { navigationRef } from '@/navigation/navigationRef';
import { RootNavigator } from '@/navigation/RootNavigator';
import { story } from '@/story';
import { useGameStore } from '@/store/gameStore';
import {
  usePlaybackDriver,
  useNewsScheduler,
  useReminderScheduler,
  ForkDriver,
} from '@/hooks/usePlaybackDriver';
import { PhoneShell } from '@/components/phone/PhoneShell';
import { NotificationBanner } from '@/components/phone/NotificationBanner';
import { ChapterCompleteOverlay } from '@/screens/overlays/ChapterCompleteOverlay';
import { EndingOverlay } from '@/screens/overlays/EndingOverlay';
import { IncomingCallOverlay } from '@/screens/overlays/IncomingCallOverlay';
import { CallSceneOverlay } from '@/screens/overlays/CallSceneOverlay';

// Screens buried in the navigation stack stop re-rendering on every store
// commit — without this, each delivered bubble re-rendered the WHOLE stack
// (Home + Messages + Chat + …), so the game got slower the deeper you went.
enableFreeze(true);

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: theme.colors.bg,
    card: theme.colors.surface,
    text: theme.colors.text,
    border: theme.colors.border,
    primary: theme.colors.accent,
  },
};

export default function App() {
  const hydrated = useGameStore((s) => s.hydrated);
  const hydrate = useGameStore((s) => s.hydrate);
  const started = useGameStore((s) => Boolean(s.state?.started));

  // Drive the narrative clock globally (delivers messages, escalates chapters),
  // publish scheduled news and fire no-reply nudges when their time comes.
  usePlaybackDriver();
  useNewsScheduler();
  useReminderScheduler();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Hide Android's REAL system navigation bar (back / home / recents): the
  // PhoneShell draws its own fictional nav bar, so the device one would be a
  // second, breaking-the-illusion bar. Immersive "overlay-swipe" lets a user
  // still swipe it up momentarily. Re-hide on resume — the keyboard or
  // returning to the app can briefly bring it back.
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const hide = () => {
      NavigationBar.setVisibilityAsync('hidden').catch(() => {});
      NavigationBar.setBehaviorAsync('overlay-swipe').catch(() => {});
    };
    hide();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') hide();
    });
    return () => sub.remove();
  }, []);

  if (!hydrated) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>{story.meta.title}</Text>
        <ActivityIndicator color={theme.colors.accent} style={{ marginTop: 16 }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      {/* The real device status bar is hidden — PhoneShell draws the fictional one. */}
      <StatusBar hidden />
      <PhoneShell>
        <NavigationContainer ref={navigationRef} theme={navTheme}>
          <RootNavigator started={started} />
        </NavigationContainer>
        {/* Parallel fork tracks each get an isolated playback clock here. */}
        <ForkDriver />
        {/* Overlays render inside the "device screen", under the OS bars. */}
        <IncomingCallOverlay />
        <CallSceneOverlay />
        <ChapterCompleteOverlay />
        <EndingOverlay />
        <NotificationBanner />
      </PhoneShell>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: '#05070A', alignItems: 'center', justifyContent: 'center' },
  splashTitle: { color: theme.colors.text, fontSize: 24, fontWeight: '300', letterSpacing: 4 },
});
