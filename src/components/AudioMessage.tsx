import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { theme } from '@/theme';
import { duration as fmtDuration } from '@/utils/format';

interface Props {
  url: string;
  durationSec?: number;
  /** Authored transcript revealed by the "transcrever" toggle (WhatsApp-like). */
  transcript?: string;
  /** Visual variant for outgoing (player) bubbles. */
  outgoing?: boolean;
}

/**
 * Voice-message bubble. The remote MP3 is NOT loaded on mount — the player is
 * created only when the user first taps play, so long chats with many audios
 * don't stream anything in the background.
 */
export function AudioMessage({ url, durationSec, transcript, outgoing }: Props) {
  const [armed, setArmed] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  return (
    <View style={styles.wrap}>
      {armed ? (
        <ActivePlayer url={url} durationSec={durationSec} />
      ) : (
        <View style={styles.row}>
          <Pressable style={styles.playBtn} onPress={() => setArmed(true)}>
            <Ionicons name="play" size={18} color="#E7ECF3" />
          </Pressable>
          <View style={styles.track}>
            <View style={styles.trackFill} />
          </View>
          <Ionicons name="mic" size={15} color={theme.colors.accent} />
          <Text style={styles.time}>{fmtDuration(durationSec ?? 0)}</Text>
        </View>
      )}

      {transcript ? (
        <>
          <Pressable style={styles.transcribe} onPress={() => setShowTranscript((v) => !v)}>
            <Ionicons
              name={showTranscript ? 'chevron-up' : 'text-outline'}
              size={12}
              color={theme.colors.textDim}
            />
            <Text style={styles.transcribeText}>
              {showTranscript ? 'ocultar transcrição' : 'transcrever'}
            </Text>
          </Pressable>
          {showTranscript ? <Text style={styles.transcript}>{transcript}</Text> : null}
        </>
      ) : null}
    </View>
  );
}

function ActivePlayer({ url, durationSec }: { url: string; durationSec?: number }) {
  const player = useAudioPlayer(url);
  const status = useAudioPlayerStatus(player);

  // Auto-play on first arm (the user just tapped play).
  useEffect(() => {
    player.play();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rewind when the audio ends so it can be replayed.
  useEffect(() => {
    if (status.didJustFinish) {
      player.pause();
      void player.seekTo(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status.didJustFinish]);

  const total = status.duration || durationSec || 0;
  const current = status.currentTime || 0;
  const progress = total > 0 ? Math.min(1, current / total) : 0;

  const toggle = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  return (
    <View style={styles.row}>
      <Pressable style={styles.playBtn} onPress={toggle}>
        {!status.isLoaded ? (
          <Ionicons name="hourglass-outline" size={16} color="#E7ECF3" />
        ) : (
          <Ionicons name={status.playing ? 'pause' : 'play'} size={18} color="#E7ECF3" />
        )}
      </Pressable>
      <View style={styles.track}>
        <View style={[styles.trackFill, { width: `${progress * 100}%` }]} />
        <View style={[styles.thumb, { left: `${progress * 100}%` }]} />
      </View>
      <Ionicons name="mic" size={15} color={theme.colors.accent} />
      <Text style={styles.time}>
        {fmtDuration(status.playing || current > 0 ? current : total)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 6, minWidth: 200 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    flex: 1,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    justifyContent: 'center',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 0,
    borderRadius: 2,
    backgroundColor: theme.colors.accent,
  },
  thumb: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    marginLeft: -5,
    backgroundColor: theme.colors.accent,
  },
  time: { color: 'rgba(231,236,243,0.7)', fontSize: 11, minWidth: 32, textAlign: 'right' },

  transcribe: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  transcribeText: { color: theme.colors.textDim, fontSize: 11.5 },
  transcript: {
    color: theme.colors.text,
    fontSize: 13.5,
    lineHeight: 19,
    fontStyle: 'italic',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
    padding: 10,
  },
});
