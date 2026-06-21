import React, { useRef } from 'react';
import { Pressable, View, Text, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  label: string;
  icon: IconName;
  /** Two-stop gradient for the icon squircle. */
  colors: readonly [string, string];
  badge?: number;
  onPress: () => void;
  /** Dock icons hide the label, like a real launcher. */
  showLabel?: boolean;
  size?: number;
}

/** A launcher app icon: vector glyph on a gradient squircle, springy press. */
export function AppTile({ label, icon, colors, badge, onPress, showLabel = true, size = 56 }: Props) {
  const press = useRef(new Animated.Value(0)).current;

  const animate = (to: number) =>
    Animated.spring(press, { toValue: to, speed: 40, bounciness: 6, useNativeDriver: true }).start();

  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] });

  return (
    <Pressable
      style={styles.wrap}
      onPress={onPress}
      onPressIn={() => animate(1)}
      onPressOut={() => animate(0)}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <LinearGradient
          colors={colors}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[styles.icon, { width: size, height: size, borderRadius: size * 0.3 }]}
        >
          <Ionicons name={icon} size={size * 0.48} color="#FFFFFF" />
        </LinearGradient>
        {badge && badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
          </View>
        ) : null}
      </Animated.View>
      {showLabel ? (
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', width: 76 },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  label: {
    color: theme.colors.text,
    fontSize: 11.5,
    marginTop: 7,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowRadius: 4,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0B0E13',
  },
  badgeText: { color: '#fff', fontSize: 10.5, fontWeight: '700' },
});
