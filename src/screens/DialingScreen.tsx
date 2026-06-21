import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Easing, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { theme } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { story } from '@/story';
import { useGameStore, selectActiveCallEvent } from '@/store/gameStore';
import { charAvatar, displayName, getCharacter, isUnknown } from '@/utils/people';
import { interpolate } from '@/utils/template';
import { mediaUrl } from '@/utils/media';
import type { Screen } from '@/navigation/types';

/** Bundled "linha chamando" tone, looped while the call is ringing. */
const RING_SOURCE = require('../../assets/audio/ringing.mp3');

const RING_BEFORE_ANSWER_MS = 3200; // answered: ring this long, then connect
const RING_BEFORE_DECLINE_MS = 5000; // declined: ring this long, then rejected
const RING_BEFORE_DROP_MS = 6500; // dropped: ring this long, then "caiu"
const RING_OUT_MS = 25000; // ringing / untriggered: rings out after this
const CLOSING_HOLD_MS = 1700; // terminal message ("recusada"/"caiu") stays this long
const ANSWERED_FALLBACK_MS = 6000; // answered with no audio: hold this long

type Phase = 'ringing' | 'connected' | 'closing';

/**
 * Outgoing (fake) call screen. The player can call anyone — it just rings (the
 * bundled tone loops, no vibration, no timer while ringing). When the story is
 * waiting on a matching `playerCall` EVENT node, that node scripts how the call
 * plays out (ringing / dropped / declined / answered); on answer it connects,
 * plays the node's audio while showing its text, and runs the in-call timer. On
 * end the call is logged and the event node resolves (see store.endCall).
 */
export function DialingScreen({ route, navigation }: Screen<'Dialing'>) {
  const { contact, number } = route.params;
  const state = useGameStore((s) => s.state);
  const endCall = useGameStore((s) => s.endCall);

  // Resolve the active call-event node once (drives how this call behaves).
  const event = useMemo(
    () => selectActiveCallEvent(useGameStore.getState().state, contact ?? null, number),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  // No event waiting → a plain call that simply rings out ('ringing').
  const outcome = event?.outcome ?? 'ringing';

  const ringSource = useMemo(
    () => (story.meta.ringbackUrl ? { uri: story.meta.ringbackUrl } : RING_SOURCE),
    [],
  );
  // Connected-call audio: the event's Media library file (media) wins over a
  // raw audioUrl. Resolved once so the player + the play/skip branch agree.
  const answerSrc = event ? mediaUrl(event.media, event.audioUrl) : undefined;
  const ringPlayer = useAudioPlayer(ringSource);
  const answerPlayer = useAudioPlayer(answerSrc ?? null);
  const answerStatus = useAudioPlayerStatus(answerPlayer);

  const [phase, setPhase] = useState<Phase>('ringing');
  const [closingText, setClosingText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef(0);
  const endedRef = useRef(false);
  const closingStatusRef = useRef<'declined' | 'made'>('made');
  const pulse = useRef(new Animated.Value(0)).current;

  const ch = contact ? getCharacter(contact) : undefined;
  const title = contact && state ? displayName(state, contact) : number || 'Número desconhecido';
  const unknown = contact && state ? isUnknown(state, contact) : true;
  const transcript = event?.text && state ? interpolate(event.text, { playerName: state.playerName, gender: state.playerGender }) : '';

  const stopAudio = () => {
    try {
      ringPlayer.pause();
    } catch {
      /* player may be torn down */
    }
    try {
      answerPlayer.pause();
    } catch {
      /* idem */
    }
  };

  // End the call once: stop audio, log it, resolve the event node, leave.
  const end = (status: 'made' | 'declined' | 'missed' | 'answered') => {
    if (endedRef.current) return;
    endedRef.current = true;
    stopAudio();
    endCall({
      contact: contact ?? null,
      number,
      status,
      durationSec: status === 'answered' ? elapsedRef.current : undefined,
    });
    navigation.goBack();
  };

  // Move into the terminal message phase ("recusada" / "a ligação caiu").
  const close = (text: string, status: 'declined' | 'made') => {
    setClosingText(text);
    closingStatusRef.current = status;
    setPhase('closing');
  };

  const hangUp = () => {
    if (phase === 'connected') end('answered');
    else if (phase === 'closing') end(closingStatusRef.current);
    else end('made');
  };

  // Ringing: start the tone + pulse, then branch by outcome.
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    // Call audio is not a notification — it ignores the system mute, like a
    // real phone playing ringback/voice through the call channel.
    try {
      ringPlayer.loop = true;
      ringPlayer.play();
    } catch {
      /* visual ring still carries it */
    }
    let timer: ReturnType<typeof setTimeout>;
    if (outcome === 'answered') timer = setTimeout(() => setPhase('connected'), RING_BEFORE_ANSWER_MS);
    else if (outcome === 'declined') timer = setTimeout(() => close('Chamada recusada', 'declined'), RING_BEFORE_DECLINE_MS);
    else if (outcome === 'dropped') timer = setTimeout(() => close('A ligação caiu', 'made'), RING_BEFORE_DROP_MS);
    else timer = setTimeout(() => end('missed'), RING_OUT_MS); // 'ringing'
    return () => {
      loop.stop();
      pulse.setValue(0);
      clearTimeout(timer);
      stopAudio();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Closing: stop ringing, hold the terminal message, then leave.
  useEffect(() => {
    if (phase !== 'closing') return;
    try {
      ringPlayer.pause();
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => end(closingStatusRef.current), CLOSING_HOLD_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Connected: stop ringing, run the in-call timer + answered audio.
  useEffect(() => {
    if (phase !== 'connected') return;
    try {
      ringPlayer.pause();
    } catch {
      /* ignore */
    }
    const ticker = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);

    let endTimer: ReturnType<typeof setTimeout> | undefined;
    if (answerSrc) {
      try {
        answerPlayer.play();
      } catch {
        /* fall back to the hold timer below */
      }
    } else {
      endTimer = setTimeout(
        () => end('answered'),
        Math.max(1500, event?.hangUpAfterMs ?? ANSWERED_FALLBACK_MS),
      );
    }
    return () => {
      clearInterval(ticker);
      if (endTimer) clearTimeout(endTimer);
      try {
        answerPlayer.pause();
      } catch {
        /* ignore */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Answered audio finished → hang up after the authored grace period.
  useEffect(() => {
    if (phase !== 'connected' || !answerStatus.didJustFinish) return;
    const t = setTimeout(() => end('answered'), Math.max(0, event?.hangUpAfterMs ?? 1500));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, answerStatus.didJustFinish]);

  const mm = Math.floor(elapsed / 60);
  const ss = (elapsed % 60).toString().padStart(2, '0');
  const statusLabel =
    phase === 'connected'
      ? `chamada de voz · ${mm}:${ss}`
      : phase === 'closing'
      ? closingText
      : 'chamando…';

  return (
    <View style={styles.backdrop}>
      <LinearGradient colors={['#101826', '#080B11', '#05070A']} style={StyleSheet.absoluteFill} />
      <View style={styles.safe}>
        <View style={styles.head}>
          <Text style={styles.kind}>{statusLabel}</Text>
          <View style={styles.avatarWrap}>
            {phase === 'ringing' ? (
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] }),
                    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) }],
                  },
                ]}
              />
            ) : null}
            <Avatar
              initials={ch?.initials ?? '?'}
              color={ch?.avatarColor}
              unknown={unknown}
              url={charAvatar(ch)}
              size={104}
            />
          </View>
          <Text style={styles.name}>{title}</Text>
          <Text style={styles.carrier}>Maravox · chamada de voz</Text>
        </View>

        {phase === 'connected' && transcript ? (
          <ScrollView style={styles.transcript} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.line}>{transcript}</Text>
          </ScrollView>
        ) : (
          <View style={styles.transcript} />
        )}

        <View style={styles.actions}>
          <View style={styles.sideAction}>
            <Ionicons name="mic-off-outline" size={22} color="#8A93A6" />
            <Text style={styles.sideLabel}>mudo</Text>
          </View>
          <Pressable style={styles.btn} onPress={hangUp}>
            <View style={[styles.circle, styles.hang]}>
              <MaterialCommunityIcons name="phone-hangup" size={28} color="#fff" />
            </View>
            <Text style={styles.btnLabel}>Encerrar</Text>
          </Pressable>
          <View style={styles.sideAction}>
            <Ionicons name="volume-high-outline" size={22} color="#8A93A6" />
            <Text style={styles.sideLabel}>alto-falante</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  safe: { flex: 1, justifyContent: 'space-between', paddingVertical: 28 },
  head: { alignItems: 'center', marginTop: 50 },
  kind: { color: theme.colors.textDim, fontSize: 13, letterSpacing: 0.5, marginBottom: 26 },
  avatarWrap: {
    padding: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 114,
    height: 114,
    borderRadius: 57,
    backgroundColor: 'rgba(79,195,247,0.4)',
  },
  name: { color: theme.colors.text, fontSize: 27, fontWeight: '700', marginTop: 22, textAlign: 'center', paddingHorizontal: 24 },
  carrier: { color: theme.colors.textFaint, fontSize: 13, marginTop: 5 },
  transcript: { flex: 1, marginHorizontal: 28, marginVertical: 18 },
  line: { color: theme.colors.text, fontSize: 16, lineHeight: 24 },
  actions: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'flex-end', paddingBottom: 24 },
  btn: { alignItems: 'center', gap: 8 },
  circle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  hang: { backgroundColor: theme.colors.danger },
  btnLabel: { color: theme.colors.textDim, fontSize: 13 },
  sideAction: { alignItems: 'center', gap: 6, paddingBottom: 10 },
  sideLabel: { color: theme.colors.textFaint, fontSize: 11 },
});
