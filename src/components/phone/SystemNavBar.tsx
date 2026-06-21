import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { navigationRef } from '@/navigation/navigationRef';

const NO_NAV_ROUTES = new Set(['Lock', 'Name']);
const DIM = '#8A93A6';
const FAINT = '#3A4150';

/** Fake Android three-button navigation. Back and Home really work. */
export function SystemNavBar() {
  const goBack = () => {
    if (navigationRef.isReady() && navigationRef.canGoBack()) navigationRef.goBack();
  };
  const goHome = () => {
    if (!navigationRef.isReady()) return;
    const route = navigationRef.getCurrentRoute()?.name ?? '';
    if (NO_NAV_ROUTES.has(route)) return;
    navigationRef.navigate('Home' as never);
  };

  return (
    <View style={styles.bar}>
      <Pressable
        style={styles.btn}
        onPress={goBack}
        hitSlop={8}
        android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: true, radius: 36 }}
      >
        {({ pressed }) => (
          <Ionicons
            name="triangle-outline"
            size={15}
            color={pressed ? '#E7ECF3' : DIM}
            style={styles.backGlyph}
          />
        )}
      </Pressable>
      <Pressable
        style={styles.btn}
        onPress={goHome}
        hitSlop={8}
        android_ripple={{ color: 'rgba(255,255,255,0.08)', borderless: true, radius: 36 }}
      >
        {({ pressed }) => (
          <Ionicons name="ellipse-outline" size={16} color={pressed ? '#E7ECF3' : DIM} />
        )}
      </Pressable>
      <View style={styles.btn}>
        <Ionicons name="square-outline" size={14} color={FAINT} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 42,
    backgroundColor: '#05070A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#1A2030',
  },
  btn: { paddingHorizontal: 28, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { transform: [{ rotate: '-90deg' }] },
});
