import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  /** App identity: glyph shown in a tinted squircle next to the title. */
  icon?: IconName;
  /** App accent color — tints the icon squircle and the bottom hairline. */
  tint?: string;
}

/**
 * App bar with per-app identity. Every internal "app" passes its own icon and
 * accent color so screens read as different applications, not one shared
 * navigation header.
 */
export function ScreenHeader({ title, subtitle, onBack, right, icon, tint }: Props) {
  const accent = tint ?? theme.colors.accentDim;
  return (
    <View style={[styles.wrap, { borderBottomColor: tint ? `${tint}66` : theme.colors.border }]}>
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </Pressable>
        ) : null}

        {icon ? (
          <View style={[styles.iconWrap, { backgroundColor: accent }]}>
            <Ionicons name={icon} size={15} color="#FFFFFF" />
          </View>
        ) : null}

        <View style={styles.titleCol}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.right}>{right ?? null}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1.5,
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 36, gap: 10 },
  backBtn: { paddingRight: 2, paddingVertical: 4 },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCol: { flex: 1 },
  title: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
  subtitle: { color: theme.colors.textDim, fontSize: 12, marginTop: 1 },
  right: { alignItems: 'flex-end' },
});
