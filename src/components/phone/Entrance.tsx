import React, { useEffect, useRef } from 'react';
import { Animated, type ViewStyle, type StyleProp } from 'react-native';

interface Props {
  children: React.ReactNode;
  /** Stagger delay in ms. */
  delay?: number;
  /** Vertical slide distance; 0 = fade only. */
  from?: number;
  /** Start scaled down slightly (app-opening feel). */
  scale?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Spring fade/slide-in on mount — the small motion that makes UI feel alive. */
export function Entrance({ children, delay = 0, from = 10, scale = false, style }: Props) {
  const v = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(v, {
      toValue: 1,
      delay,
      speed: 16,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const transform = [
    { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }) },
    ...(scale ? [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] : []),
  ];

  return (
    <Animated.View style={[style, { opacity: v, transform }]}>{children}</Animated.View>
  );
}
