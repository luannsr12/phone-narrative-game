import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { Avatar } from '@/components/Avatar';

export type MuralTab = 'feed' | 'search' | 'notifications' | 'profile';

interface Props {
  active: MuralTab;
  onChange: (t: MuralTab) => void;
  /** The "+" new-post action (separate from the tabs). */
  onNewPost: () => void;
  me?: { initials: string; avatarColor?: string; avatarUrl?: string };
  /** Unread Mural notifications (badge on the bell). */
  unread: number;
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function TabButton({
  name,
  active,
  onPress,
}: {
  name: IconName;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.tab} onPress={onPress} hitSlop={6}>
      <Ionicons name={name} size={25} color={active ? theme.colors.text : theme.colors.textDim} />
    </Pressable>
  );
}

/** Instagram-style bottom bar for the Mural app: feed, search, +, bell, profile. */
export function MuralTabBar({ active, onChange, onNewPost, me, unread }: Props) {
  return (
    <View style={styles.bar}>
      <TabButton name={active === 'feed' ? 'home' : 'home-outline'} active={active === 'feed'} onPress={() => onChange('feed')} />
      <TabButton name="search" active={active === 'search'} onPress={() => onChange('search')} />

      {/* New post (+) — stylized like a real app's create button. */}
      <Pressable style={styles.tab} onPress={onNewPost} hitSlop={6}>
        <View style={styles.plus}>
          <Ionicons name="add" size={20} color={theme.colors.text} />
        </View>
      </Pressable>

      <Pressable style={styles.tab} onPress={() => onChange('notifications')} hitSlop={6}>
        <Ionicons
          name={active === 'notifications' ? 'notifications' : 'notifications-outline'}
          size={25}
          color={active === 'notifications' ? theme.colors.text : theme.colors.textDim}
        />
        {unread > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        ) : null}
      </Pressable>

      <Pressable style={styles.tab} onPress={() => onChange('profile')} hitSlop={6}>
        <View style={[styles.avatarWrap, active === 'profile' && styles.avatarWrapActive]}>
          <Avatar initials={me?.initials ?? '?'} color={me?.avatarColor} url={me?.avatarUrl} size={24} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 9,
    paddingHorizontal: 6,
    backgroundColor: theme.colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  plus: {
    width: 30,
    height: 26,
    borderRadius: 8,
    borderWidth: 1.6,
    borderColor: theme.colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: '28%',
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: theme.colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.surface,
  },
  badgeText: { color: '#fff', fontSize: 9.5, fontWeight: '800' },
  avatarWrap: { borderRadius: 14, padding: 1.5, borderWidth: 1.5, borderColor: 'transparent' },
  avatarWrapActive: { borderColor: theme.colors.text },
});
