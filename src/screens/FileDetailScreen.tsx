import React from 'react';
import { View, Text, ScrollView, Pressable, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { theme } from '@/theme';
import { AudioMessage } from '@/components/AudioMessage';
import { ScreenHeader } from '@/components/ScreenHeader';
import { EVIDENCE_ICON } from '@/components/EvidenceCard';
import { useGameStore } from '@/store/gameStore';
import { story } from '@/story';
import { displayName } from '@/utils/people';
import { mediaUrl } from '@/utils/media';
import { stamp } from '@/utils/format';
import type { Screen } from '@/navigation/types';

const KIND_LABEL: Record<string, string> = {
  photo: 'Foto',
  video: 'Vídeo',
  audio: 'Áudio',
  document: 'Documento',
  screenshot: 'Captura de tela',
  location: 'Localização',
  report: 'Reportagem',
};

export function FileDetailScreen({ navigation, route }: Screen<'FileDetail'>) {
  const { evidenceId } = route.params;
  const state = useGameStore((s) => s.state);
  const ev = story.evidence[evidenceId];
  const instance = state?.evidence.find((e) => e.id === evidenceId);
  if (!state || !ev) return null;

  const evUrl = mediaUrl(ev.media, ev.url);

  return (
    <View style={styles.bg}>
      <ScreenHeader title="Evidência"
        icon="folder-open"
        tint="#3F51A5" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.content}>
        {evUrl && (ev.kind === 'photo' || ev.kind === 'screenshot') ? (
          <Image source={{ uri: evUrl }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={[styles.hero, { backgroundColor: ev.thumbnailColor ?? theme.colors.surfaceHigh }]}>
            <Ionicons name={EVIDENCE_ICON[ev.kind]} size={48} color="#C9D2DF" />
            <Text style={styles.kind}>{KIND_LABEL[ev.kind] ?? ev.kind}</Text>
          </View>
        )}

        {evUrl && ev.kind === 'audio' ? (
          <View style={styles.audioCard}>
            <AudioMessage url={evUrl} />
          </View>
        ) : null}

        {evUrl && (ev.kind === 'video' || ev.kind === 'document' || ev.kind === 'report') ? (
          <Pressable style={styles.playBtn} onPress={() => void WebBrowser.openBrowserAsync(evUrl)}>
            <Ionicons name={ev.kind === 'video' ? 'videocam' : 'document-text'} size={20} color="#E7ECF3" />
            <Text style={styles.playText}>
              {ev.kind === 'video' ? 'Assistir vídeo' : 'Abrir documento'}
            </Text>
          </Pressable>
        ) : null}

        <Text style={styles.title}>{ev.title}</Text>
        <Text style={styles.desc}>{ev.description}</Text>

        {ev.body ? (
          <View style={styles.bodyCard}>
            <Text style={styles.bodyText}>{ev.body}</Text>
          </View>
        ) : null}

        <View style={styles.metaCard}>
          <Meta label="Quem enviou" value={ev.source === 'system' ? 'Sistema' : displayName(state, ev.source)} />
          <Meta label="Data recebida" value={instance ? stamp(instance.receivedAt) : '—'} />
          <Meta label="Ligação com o caso" value={ev.caseRelevance} last />
        </View>
      </ScrollView>
    </View>
  );
}

function Meta({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.metaRow, !last && styles.metaDivider]}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 16 },
  hero: { height: 160, borderRadius: theme.radius.md, alignItems: 'center', justifyContent: 'center' },
  heroImage: { height: 220, borderRadius: theme.radius.md, backgroundColor: theme.colors.surfaceHigh },
  audioCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  playBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
    backgroundColor: theme.colors.accentDim,
    borderRadius: theme.radius.pill,
    paddingVertical: 12,
  },
  playText: { color: theme.colors.text, fontSize: 14.5, fontWeight: '700' },
  kind: { color: theme.colors.text, fontSize: 13, marginTop: 8, letterSpacing: 1, opacity: 0.8 },
  title: { color: theme.colors.text, fontSize: 21, fontWeight: '800', marginTop: 16 },
  desc: { color: theme.colors.textDim, fontSize: 15, lineHeight: 22, marginTop: 8 },
  bodyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    marginTop: 16,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
  },
  bodyText: { color: theme.colors.text, fontSize: 14.5, lineHeight: 22, fontStyle: 'italic' },
  metaCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 14,
    marginTop: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  metaRow: { paddingVertical: 10 },
  metaDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
  metaLabel: { color: theme.colors.accent, fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  metaValue: { color: theme.colors.text, fontSize: 14.5, marginTop: 4, lineHeight: 20 },
});
