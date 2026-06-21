import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { AppTile } from '@/components/AppTile';
import { Entrance } from '@/components/phone/Entrance';
import { useGameStore, selectTotalUnread } from '@/store/gameStore';
import { story } from '@/story';
import { clock } from '@/utils/format';
import { interpolate } from '@/utils/template';
import type { Screen } from '@/navigation/types';

const WEEKDAYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

/** The phone's launcher: wallpaper, widgets, swipeable workspaces and dock. */
export function HomeScreen({ navigation }: Screen<'Home'>) {
  const state = useGameStore((s) => s.state);
  const unread = useGameStore((s) => selectTotalUnread(s.state));
  const [time, setTime] = useState(() => Date.now());
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();

  useEffect(() => {
    const t = setInterval(() => setTime(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  if (!state) return null;

  const chapter = story.chapters[state.currentChapter];
  const d = new Date(time);
  const dateLabel = `${WEEKDAYS[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`;

  const go = (name: string) => () => navigation.navigate(name as never);

  return (
    <View style={styles.bg}>
      {/* Wallpaper */}
      <LinearGradient colors={['#0D1424', '#0A0D14', '#070A0F']} style={StyleSheet.absoluteFill} />
      <View pointerEvents="none" style={styles.wallpaper}>
        <View style={[styles.blob, styles.blobA]} />
        <View style={[styles.blob, styles.blobB]} />
        <View style={[styles.blob, styles.blobC]} />
      </View>

      {/* Workspaces — swipe sideways like a real launcher. */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setPage(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        style={{ flex: 1 }}
      >
        {/* ---- workspace 1: widgets + main apps ---- */}
        <View style={[styles.pageWrap, { width }]}>
          <Entrance delay={0} from={8}>
            <View style={styles.clockWidget}>
              <Text style={styles.clock}>{clock(time)}</Text>
              <View style={styles.dateRow}>
                <Text style={styles.date}>{dateLabel}</Text>
                <Ionicons name="cloudy" size={13} color={theme.colors.textDim} />
                <Text style={styles.date}>12° Neblina</Text>
              </View>
            </View>
          </Entrance>

          {chapter ? (
            <Entrance delay={60} from={10}>
              <View style={styles.notesWidget}>
                <View style={styles.notesHead}>
                  <Ionicons name="create-outline" size={13} color={theme.colors.textDim} />
                  <Text style={styles.notesTitle}>Notas</Text>
                </View>
                <Text style={styles.notesBody}>
                  {interpolate(chapter.objective, { playerName: state.playerName, gender: state.playerGender })}
                </Text>
              </View>
            </Entrance>
          ) : null}

          <View style={styles.spacer} />

          {/* 4-column grid, like a real launcher (Mural lives here too). */}
          <View style={styles.grid}>
            <View style={styles.gridCell}>
              <Entrance delay={110} scale from={14}>
                <AppTile label="Contatos" icon="people" colors={['#FFB74D', '#C77800']} onPress={go('Contacts')} />
              </Entrance>
            </View>
            <View style={styles.gridCell}>
              <Entrance delay={145} scale from={14}>
                <AppTile label="Arquivos" icon="folder" colors={['#7986CB', '#3F51A5']} onPress={go('Files')} />
              </Entrance>
            </View>
            <View style={styles.gridCell}>
              <Entrance delay={180} scale from={14}>
                <AppTile label="Galeria" icon="images" colors={['#BA68C8', '#7B1FA2']} onPress={go('Gallery')} />
              </Entrance>
            </View>
            <View style={styles.gridCell}>
              <Entrance delay={215} scale from={14}>
                <AppTile label="Linha do Tempo" icon="time" colors={['#9575CD', '#5E35B1']} onPress={go('Timeline')} />
              </Entrance>
            </View>
            <View style={styles.gridCell}>
              <Entrance delay={250} scale from={14}>
                <AppTile label="Mural" icon="aperture" colors={['#E4577B', '#8E2DA8']} onPress={go('Social')} />
              </Entrance>
            </View>
            <View style={styles.gridCell}>
              <Entrance delay={285} scale from={14}>
                <AppTile label="Blog" icon="create" colors={['#5C6BC0', '#303F9F']} onPress={go('Blog')} />
              </Entrance>
            </View>
          </View>
        </View>

        {/* ---- workspace 2: extra apps, grid anchored at the TOP like a phone ---- */}
        <View style={[styles.pageWrap, { width }]}>
          <View style={styles.gridTop}>
            <View style={styles.gridCell}>
              <AppTile label="Navegador" icon="compass" colors={['#42A5F5', '#1565C0']} onPress={go('Browser')} />
            </View>
            <View style={styles.gridCell}>
              <AppTile label="Pares" icon="extension-puzzle" colors={['#66BB6A', '#2E7D32']} onPress={go('MemoryGame')} />
            </View>
            <View style={styles.gridCell}>
              <AppTile label="Tulu Bank" icon="wallet" colors={['#26A69A', '#00695C']} onPress={go('Bank')} />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Launcher page dots */}
      <View style={styles.dots}>
        <View style={[styles.dot, page === 0 && styles.dotActive]} />
        <View style={[styles.dot, page === 1 && styles.dotActive]} />
      </View>

      {/* Dock */}
      <Entrance delay={140} from={16} style={styles.dockWrap}>
        <View style={styles.dock}>
          <AppTile label="Mensagens" icon="chatbubble-ellipses" colors={['#3BD5A0', '#1E7D63']} badge={unread} showLabel={false} onPress={go('Messages')} />
          <AppTile label="Telefone" icon="call" colors={['#4FC3F7', '#1976A8']} showLabel={false} onPress={go('Calls')} />
          <AppTile label="Notícias" icon="newspaper" colors={['#FF8A65', '#C2502E']} showLabel={false} onPress={go('News')} />
          <AppTile label="Ajustes" icon="settings" colors={['#90A4AE', '#46535C']} showLabel={false} onPress={go('Settings')} />
        </View>
      </Entrance>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  wallpaper: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  blob: { position: 'absolute', borderRadius: 999 },
  blobA: { width: 320, height: 320, top: -90, right: -110, backgroundColor: 'rgba(46,107,98,0.13)' },
  blobB: { width: 260, height: 260, bottom: 60, left: -120, backgroundColor: 'rgba(58,91,160,0.10)' },
  blobC: { width: 180, height: 180, top: '42%', right: -60, backgroundColor: 'rgba(142,91,160,0.08)' },

  pageWrap: { paddingHorizontal: 18, paddingBottom: 6 },

  clockWidget: { marginTop: 24, paddingHorizontal: 6 },
  clock: { color: theme.colors.text, fontSize: 56, fontWeight: '200', letterSpacing: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  date: { color: theme.colors.textDim, fontSize: 14 },

  notesWidget: {
    marginTop: 18,
    backgroundColor: 'rgba(28,34,48,0.78)',
    borderRadius: 20,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  notesHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  notesTitle: { color: theme.colors.textDim, fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  notesBody: { color: theme.colors.text, fontSize: 14.5, lineHeight: 20 },

  spacer: { flex: 1 },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  gridTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
  },
  gridCell: { width: '25%', alignItems: 'center', marginBottom: 16 },

  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginVertical: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)' },
  dotActive: { backgroundColor: 'rgba(255,255,255,0.6)' },

  dockWrap: { paddingHorizontal: 18 },
  dock: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 28,
    paddingVertical: 12,
    marginBottom: 12,
  },
});
