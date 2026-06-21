import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Animated,
  Easing,
  Vibration,
  StyleSheet,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { theme } from '@/theme';
import { Avatar } from '@/components/Avatar';
import {
  useGameStore,
  selectCallScene,
  selectCallStep,
  selectCallStepOptions,
} from '@/store/gameStore';
import { useUiStore } from '@/store/uiStore';
import { charAvatar, displayName, getCharacter, isUnknown } from '@/utils/people';
import { interpolate } from '@/utils/template';
import { mediaUrl } from '@/utils/media';

/** Incoming ringtone (received call), looped while the phone rings. */
const RECEIVED_SOURCE = require('../../../assets/audio/sound_call_received.mp3');
/** Ringback tone ("chamando…"), used when the call is OUTGOING. */
const RINGBACK_SOURCE = require('../../../assets/audio/ringing.mp3');

/** One spoken line shown in the running call transcript. */
interface Line {
  who: 'them' | 'me';
  text: string;
}

/**
 * Full-screen INTERACTIVE voice call (the `callScene` node). Unlike the plain
 * `call` overlay it walks the node's private sub-flow: ring → answer/decline →
 * MP3 lines, in-call reply choices, effects, hang up. Audio playback, the reply
 * chips and the ring timeout all live here; the engine owns the graph walk.
 */
export function CallSceneOverlay() {
  const state = useGameStore((s) => s.state);
  const answerCallScene = useGameStore((s) => s.answerCallScene);
  const declineCallScene = useGameStore((s) => s.declineCallScene);
  const chooseCallStep = useGameStore((s) => s.chooseCallStep);
  const completeCallStep = useGameStore((s) => s.completeCallStep);
  const timeoutCallStep = useGameStore((s) => s.timeoutCallStep);
  const hangUpCallScene = useGameStore((s) => s.hangUpCallScene);
  const mute = useUiStore((s) => s.mute);

  const scene = state ? selectCallScene(state) : undefined;
  const step = state ? selectCallStep(state) : undefined;
  const options = state ? selectCallStepOptions(state) : [];
  const connected = !!state?.activeCall;
  const active = !!scene && !!state && !state.endingId && !state.justCompletedChapter;

  const [elapsed, setElapsed] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  // Pulsing ring + vibration while ringing (mirrors IncomingCallOverlay).
  const pulse = useRef(new Animated.Value(0)).current;
  // Incoming → "received" ringtone; outgoing → ringback. The phone always
  // VIBRATES while ringing; the sound only plays when "Som" is on (not muted).
  const receivedPlayer = useAudioPlayer(RECEIVED_SOURCE);
  const ringbackPlayer = useAudioPlayer(RINGBACK_SOURCE);
  useEffect(() => {
    if (!active || connected) return;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    Vibration.vibrate([0, 380, 700], true);
    const player = scene?.direction === 'outgoing' ? ringbackPlayer : receivedPlayer;
    if (!mute) {
      try {
        player.loop = true;
        player.play();
      } catch {
        /* the visual ring still carries it */
      }
    }
    return () => {
      loop.stop();
      pulse.setValue(0);
      Vibration.cancel();
      try {
        player.pause();
      } catch {
        /* player may be torn down */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, connected, scene?.id, mute]);

  // Auto-miss after the authored ring duration (0/absent = ring until acted on).
  useEffect(() => {
    if (!active || connected) return;
    const secs = scene?.ringSeconds ?? 0;
    if (secs <= 0) return;
    const t = setTimeout(() => declineCallScene(true), secs * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, connected, scene?.id]);

  // Reset the transcript + timer whenever a different call begins / it ends.
  useEffect(() => {
    setElapsed(0);
    setLines([]);
  }, [scene?.id]);

  // In-call timer.
  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [connected]);

  // Append the current audio line to the transcript as it starts playing.
  useEffect(() => {
    if (!connected || step?.type !== 'audio' || !step.text || !state) return;
    const who: Line['who'] = step.speaker === 'player' ? 'me' : 'them';
    const text = interpolate(step.text, { playerName: state.playerName, gender: state.playerGender });
    setLines((prev) =>
      prev.length && prev[prev.length - 1].text === text ? prev : [...prev, { who, text }],
    );
    // step.text/speaker are fixed per step.id; playerName is the only external input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, step?.id, state?.playerName]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [lines.length]);

  // In-call choice with no reply: after `timeoutSec`, auto-route it (the engine
  // goes to `timeoutNext`, or hangs up if none). Cleared when the player picks
  // (step changes) or the call ends.
  useEffect(() => {
    if (!connected || step?.type !== 'choice') return;
    const secs = step.timeoutSec ?? 0;
    if (secs <= 0) return;
    const t = setTimeout(() => timeoutCallStep(), secs * 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connected, step?.id]);

  if (!active || !scene || !state) return null;

  const ch = getCharacter(scene.caller);
  const mm = Math.floor(elapsed / 60);
  const ss = (elapsed % 60).toString().padStart(2, '0');
  const statusLabel = connected
    ? `chamada de voz · ${mm}:${ss}`
    : scene.direction === 'outgoing'
    ? 'chamando…'
    : 'chamada recebida';

  const pickReply = (optionId: string) => {
    const opt = options.find((o) => o.id === optionId);
    if (opt && !opt.silent) {
      const said = interpolate(opt.say ?? opt.text, { playerName: state.playerName, gender: state.playerGender });
      setLines((prev) => [...prev, { who: 'me', text: said }]);
    }
    chooseCallStep(optionId);
  };

  return (
    <View style={styles.backdrop}>
      <LinearGradient colors={['#101826', '#080B11', '#05070A']} style={StyleSheet.absoluteFill} />
      <View style={styles.safe}>
        <View style={styles.head}>
          <Text style={styles.kind}>{statusLabel}</Text>
          <View style={styles.avatarWrap}>
            {!connected ? (
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
                    transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] }) }],
                  },
                ]}
              />
            ) : null}
            <Avatar
              initials={ch?.initials ?? '?'}
              color={ch?.avatarColor}
              unknown={isUnknown(state, scene.caller)}
              url={charAvatar(ch)}
              size={104}
            />
          </View>
          <Text style={styles.name}>{displayName(state, scene.caller)}</Text>
          <Text style={styles.carrier}>Maravox · chamada de voz</Text>
        </View>

        {connected ? (
          <ScrollView
            ref={scrollRef}
            style={styles.transcript}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {lines.map((l, i) => (
              <View key={i} style={[styles.lineRow, l.who === 'me' && styles.lineRowMe]}>
                <Text style={[styles.line, l.who === 'me' && styles.lineMe]}>{l.text}</Text>
              </View>
            ))}
            {/* Mounts per audio/silence step (keyed) and reports when it ends. */}
            {step?.type === 'audio' ? (
              <CallAudioStep
                key={step.id}
                url={mediaUrl(step.media, step.audioUrl)}
                holdSec={step.holdSec}
                onDone={completeCallStep}
              />
            ) : null}
            {step?.type === 'delay' ? (
              <SilenceStep key={step.id} seconds={step.seconds} onDone={completeCallStep} />
            ) : null}
          </ScrollView>
        ) : (
          <View style={styles.transcript} />
        )}

        {connected && step?.type === 'choice' ? (
          <View style={styles.replies}>
            {step.prompt ? <Text style={styles.prompt}>{interpolate(step.prompt, { playerName: state.playerName, gender: state.playerGender })}</Text> : null}
            {options.map((o) => (
              <Pressable
                key={o.id}
                style={({ pressed }) => [styles.reply, pressed && styles.replyPressed]}
                onPress={() => pickReply(o.id)}
              >
                <Text style={styles.replyText}>{o.text}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {connected ? (
          <View style={styles.actions}>
            <View style={styles.sideAction}>
              <Ionicons name="mic-off-outline" size={22} color="#8A93A6" />
              <Text style={styles.sideLabel}>mudo</Text>
            </View>
            <Pressable style={styles.btn} onPress={hangUpCallScene}>
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
        ) : (
          <View style={styles.actions}>
            <Pressable style={styles.btn} onPress={() => declineCallScene(false)}>
              <View style={[styles.circle, styles.decline]}>
                <MaterialCommunityIcons name="phone-hangup" size={26} color="#fff" />
              </View>
              <Text style={styles.btnLabel}>Recusar</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={answerCallScene}>
              <View style={styles.pulseWrap}>
                <Animated.View
                  style={[
                    styles.pulseRingSmall,
                    {
                      opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
                      transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) }],
                    },
                  ]}
                />
                <View style={[styles.circle, styles.accept]}>
                  <Ionicons name="call" size={26} color="#fff" />
                </View>
              </View>
              <Text style={styles.btnLabel}>Atender</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

/** Plays one MP3 line (or holds a silent caption) and reports when it ends. */
function CallAudioStep({ url, holdSec, onDone }: { url?: string; holdSec?: number; onDone: () => void }) {
  const player = useAudioPlayer(url ?? null);
  const status = useAudioPlayerStatus(player);
  const done = useRef(false);
  const finish = () => {
    if (done.current) return;
    done.current = true;
    onDone();
  };
  // This component is KEYED by the step id in the parent, so it remounts for
  // every audio/silence step — `url`/`holdSec`/`onDone` are therefore fixed for
  // a given mount and the effect only needs to start playback once. Listing
  // `url` keeps the dep rule honest without changing that (it never changes
  // mid-mount); if the keying contract is ever dropped, this still re-inits.
  useEffect(() => {
    if (url) {
      try {
        player.play();
      } catch {
        finish();
      }
      return () => {
        try {
          player.pause();
        } catch {
          /* ignore */
        }
      };
    }
    const t = setTimeout(finish, Math.max(800, (holdSec ?? 4) * 1000));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, holdSec]);
  useEffect(() => {
    if (url && status.didJustFinish) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, status.didJustFinish]);
  return null;
}

/** Holds a silent beat for `seconds`, then advances. */
function SilenceStep({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const done = useRef(false);
  useEffect(() => {
    const t = setTimeout(() => {
      if (done.current) return;
      done.current = true;
      onDone();
    }, Math.max(400, seconds * 1000));
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  safe: { flex: 1, justifyContent: 'space-between', paddingVertical: 28 },
  head: { alignItems: 'center', marginTop: 30 },
  kind: { color: theme.colors.textDim, fontSize: 13, letterSpacing: 0.5, marginBottom: 22 },
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
  name: { color: theme.colors.text, fontSize: 27, fontWeight: '700', marginTop: 18, textAlign: 'center', paddingHorizontal: 24 },
  carrier: { color: theme.colors.textFaint, fontSize: 13, marginTop: 5 },
  transcript: { flex: 1, marginHorizontal: 24, marginVertical: 14 },
  lineRow: { alignSelf: 'flex-start', maxWidth: '88%', marginBottom: 12 },
  lineRowMe: { alignSelf: 'flex-end' },
  line: { color: theme.colors.text, fontSize: 16, lineHeight: 23 },
  lineMe: { color: theme.colors.accent },
  replies: { paddingHorizontal: 20, paddingBottom: 10, gap: 9 },
  prompt: { color: theme.colors.textDim, fontSize: 13, marginBottom: 4, textAlign: 'center' },
  reply: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  replyPressed: { backgroundColor: 'rgba(255,255,255,0.13)' },
  replyText: { color: theme.colors.text, fontSize: 15, lineHeight: 20 },
  actions: { flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'flex-end', paddingBottom: 18 },
  btn: { alignItems: 'center', gap: 8 },
  circle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  pulseWrap: { alignItems: 'center', justifyContent: 'center' },
  pulseRingSmall: { position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: '#2E7D4F' },
  accept: { backgroundColor: '#2E7D4F' },
  decline: { backgroundColor: theme.colors.danger },
  hang: { backgroundColor: theme.colors.danger },
  btnLabel: { color: theme.colors.textDim, fontSize: 13 },
  sideAction: { alignItems: 'center', gap: 6, paddingBottom: 10 },
  sideLabel: { color: theme.colors.textFaint, fontSize: 11 },
});
