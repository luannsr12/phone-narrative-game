import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, Animated, Easing, Vibration, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer } from 'expo-audio';
import { theme } from '@/theme';
import { Avatar } from '@/components/Avatar';
import { useGameStore, selectCurrentNode } from '@/store/gameStore';
import { useUiStore } from '@/store/uiStore';
import { charAvatar, displayName, getCharacter, isUnknown } from '@/utils/people';
import { interpolate } from '@/utils/template';

/** Incoming ringtone (received call); ringback ("chamando…") for outgoing. */
const RECEIVED_SOURCE = require('../../../assets/audio/sound_call_received.mp3');
const RINGBACK_SOURCE = require('../../../assets/audio/ringing.mp3');

/** Full-screen simulated voice call. Answer to read the live transcript. */
export function IncomingCallOverlay() {
  const state = useGameStore((s) => s.state);
  const answerCall = useGameStore((s) => s.answerCall);
  const mute = useUiStore((s) => s.mute);
  const [inCall, setInCall] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const node = state ? selectCurrentNode(state) : undefined;
  const active = !!state && !state.endingId && !state.justCompletedChapter && node?.type === 'call';

  // Pulsing ring around the answer button while ringing.
  const pulse = useRef(new Animated.Value(0)).current;
  // The phone always VIBRATES while ringing; the ringtone only plays when "Som"
  // is on (not muted). Incoming → received ringtone; outgoing → ringback.
  const receivedPlayer = useAudioPlayer(RECEIVED_SOURCE);
  const ringbackPlayer = useAudioPlayer(RINGBACK_SOURCE);
  useEffect(() => {
    if (!active || inCall) return;
    const loop = Animated.loop(
      Animated.timing(pulse, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    // Ring vibration pattern while the call is unanswered.
    Vibration.vibrate([0, 380, 700], true);
    const player = node?.type === 'call' && node.direction === 'outgoing' ? ringbackPlayer : receivedPlayer;
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
  }, [active, inCall, node?.id, mute]);

  // In-call timer.
  useEffect(() => {
    setInCall(false);
    setElapsed(0);
  }, [node?.id]);
  useEffect(() => {
    if (!inCall) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [inCall]);

  if (!active || node?.type !== 'call' || !state) return null;

  const ch = getCharacter(node.caller);
  const transcript = (node.transcript ?? []).map((l) => interpolate(l, { playerName: state.playerName, gender: state.playerGender }));
  const mm = Math.floor(elapsed / 60);
  const ss = (elapsed % 60).toString().padStart(2, '0');

  return (
    <View style={styles.backdrop}>
      <LinearGradient colors={['#101826', '#080B11', '#05070A']} style={StyleSheet.absoluteFill} />
      <View style={styles.safe}>
        <View style={styles.head}>
          <Text style={styles.kind}>
            {inCall ? `chamada de voz · ${mm}:${ss}` : node.direction === 'incoming' ? 'chamada recebida' : 'chamando…'}
          </Text>
          <View style={styles.avatarWrap}>
            <Avatar
              initials={ch?.initials ?? '?'}
              color={ch?.avatarColor}
              unknown={isUnknown(state, node.caller)}
              url={charAvatar(ch)}
              size={104}
            />
          </View>
          <Text style={styles.name}>{displayName(state, node.caller)}</Text>
          <Text style={styles.carrier}>Maravox · chamada de voz</Text>
        </View>

        {inCall ? (
          <ScrollView style={styles.transcript} contentContainerStyle={{ paddingBottom: 20 }}>
            {transcript.map((line, i) => (
              <Text key={i} style={styles.line}>
                {line}
              </Text>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.transcript} />
        )}

        {inCall ? (
          <View style={styles.actions}>
            <View style={styles.sideAction}>
              <Ionicons name="mic-off-outline" size={22} color="#8A93A6" />
              <Text style={styles.sideLabel}>mudo</Text>
            </View>
            <Pressable style={styles.btn} onPress={() => answerCall(true)}>
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
            <Pressable style={styles.btn} onPress={() => answerCall(false)}>
              <View style={[styles.circle, styles.decline]}>
                <MaterialCommunityIcons name="phone-hangup" size={26} color="#fff" />
              </View>
              <Text style={styles.btnLabel}>Recusar</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => setInCall(true)}>
              <View style={styles.pulseWrap}>
                <Animated.View
                  style={[
                    styles.pulseRing,
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

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject },
  safe: { flex: 1, justifyContent: 'space-between', paddingVertical: 28 },
  head: { alignItems: 'center', marginTop: 26 },
  kind: { color: theme.colors.textDim, fontSize: 13, letterSpacing: 0.5, marginBottom: 22 },
  avatarWrap: { padding: 5, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  name: { color: theme.colors.text, fontSize: 27, fontWeight: '700', marginTop: 18 },
  carrier: { color: theme.colors.textFaint, fontSize: 13, marginTop: 5 },
  transcript: { flex: 1, marginHorizontal: 28, marginVertical: 18 },
  line: { color: theme.colors.text, fontSize: 16, lineHeight: 24, marginBottom: 14 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'flex-end',
    paddingBottom: 16,
  },
  btn: { alignItems: 'center', gap: 8 },
  circle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  pulseWrap: { alignItems: 'center', justifyContent: 'center' },
  pulseRing: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2E7D4F',
  },
  accept: { backgroundColor: '#2E7D4F' },
  decline: { backgroundColor: theme.colors.danger },
  hang: { backgroundColor: theme.colors.danger },
  btnLabel: { color: theme.colors.textDim, fontSize: 13 },
  sideAction: { alignItems: 'center', gap: 6, paddingBottom: 10 },
  sideLabel: { color: theme.colors.textFaint, fontSize: 11 },
});
