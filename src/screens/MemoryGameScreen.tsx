import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useGameStore } from '@/store/gameStore';
import { story } from '@/story';
import { money } from '@/utils/format';
import type { Screen } from '@/navigation/types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const FACES: IconName[] = ['paw', 'leaf', 'flame', 'star', 'heart', 'moon', 'flash', 'planet'];
const BET_CHIPS = [10, 20, 50, 100];
const TINT = '#2E7D32';

interface Card {
  key: number;
  face: IconName;
  matched: boolean;
}

type Phase = 'lobby' | 'playing' | 'won' | 'lost';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function newDeck(): Card[] {
  return shuffle([...FACES, ...FACES]).map((face, key) => ({ key, face, matched: false }));
}

/**
 * "Pares" — memory match with real stakes: the player bets from their
 * Tulu Bank balance, doubles it by clearing the board, and loses the bet by
 * running out of attempts (wrong matches, capped by meta.minigameAttempts).
 * This is the player-driven way to earn money for story gates.
 */
export function MemoryGameScreen({ navigation }: Screen<'MemoryGame'>) {
  const balance = useGameStore((s) => s.state?.money ?? 0);
  const bankTransact = useGameStore((s) => s.bankTransact);
  const maxAttempts = Math.max(1, story.meta.minigameAttempts ?? 8);

  const [phase, setPhase] = useState<Phase>('lobby');
  const [bet, setBet] = useState(0);
  const [deck, setDeck] = useState<Card[]>(newDeck);
  const [open, setOpen] = useState<number[]>([]);
  const [errors, setErrors] = useState(0);
  const lockRef = useRef(false);

  const matchedCount = deck.filter((c) => c.matched).length;
  const attemptsLeft = maxAttempts - errors;

  const start = () => {
    if (bet <= 0 || bet > balance) return;
    bankTransact(-bet, 'Aposta — Pares');
    setDeck(newDeck());
    setOpen([]);
    setErrors(0);
    lockRef.current = false;
    setPhase('playing');
  };

  const flip = (key: number) => {
    if (phase !== 'playing' || lockRef.current) return;
    const card = deck[key];
    if (card.matched || open.includes(key)) return;

    const nextOpen = [...open, key];
    setOpen(nextOpen);
    if (nextOpen.length < 2) return;

    const [a, b] = nextOpen;
    if (deck[a].face === deck[b].face) {
      const nextDeck = deck.map((c) =>
        c.key === a || c.key === b ? { ...c, matched: true } : c,
      );
      setDeck(nextDeck);
      setOpen([]);
      if (nextDeck.every((c) => c.matched)) {
        // Cleared the board: the bet comes back doubled.
        bankTransact(bet * 2, 'Prêmio — Pares');
        setPhase('won');
      }
    } else {
      const nextErrors = errors + 1;
      setErrors(nextErrors);
      lockRef.current = true;
      setTimeout(() => {
        setOpen([]);
        lockRef.current = false;
        // Out of attempts: the bet is gone (it left the account at start).
        if (nextErrors >= maxAttempts) setPhase('lost');
      }, 750);
    }
  };

  const subtitle =
    phase === 'playing'
      ? `aposta ${money(bet)} · ${matchedCount / 2} de ${FACES.length} pares`
      : `saldo ${money(balance)}`;

  return (
    <View style={styles.bg}>
      <ScreenHeader
        title="Pares"
        icon="extension-puzzle"
        tint={TINT}
        subtitle={subtitle}
        onBack={() => navigation.navigate('Home')}
      />

      {phase === 'lobby' ? (
        <Lobby balance={balance} bet={bet} onBet={setBet} onStart={start} maxAttempts={maxAttempts} />
      ) : null}

      {phase === 'playing' ? (
        <>
          {/* Attempts (wrong matches) left this round */}
          <View style={styles.heartsRow}>
            {Array.from({ length: maxAttempts }, (_, i) => (
              <Ionicons
                key={i}
                name={i < attemptsLeft ? 'heart' : 'heart-outline'}
                size={16}
                color={i < attemptsLeft ? '#E4577B' : theme.colors.textFaint}
              />
            ))}
          </View>
          <View style={styles.board}>
            {deck.map((card) => (
              <MemoryCard
                key={card.key}
                card={card}
                faceUp={card.matched || open.includes(card.key)}
                onPress={() => flip(card.key)}
              />
            ))}
          </View>
        </>
      ) : null}

      {phase === 'won' ? (
        <ResultCard
          icon="trophy"
          color={theme.colors.warning}
          title="Você dobrou a aposta!"
          detail={`${money(bet * 2)} caíram na sua conta.`}
          actionLabel="Jogar de novo"
          onAction={() => setPhase('lobby')}
          onBank={() => navigation.navigate('Bank')}
        />
      ) : null}

      {phase === 'lost' ? (
        <ResultCard
          icon="heart-dislike"
          color="#E4577B"
          title="Acabaram as tentativas"
          detail={`Você perdeu ${money(bet)}.`}
          actionLabel="Tentar de novo"
          onAction={() => setPhase('lobby')}
          onBank={() => navigation.navigate('Bank')}
        />
      ) : null}
    </View>
  );
}

function Lobby({
  balance,
  bet,
  onBet,
  onStart,
  maxAttempts,
}: {
  balance: number;
  bet: number;
  onBet: (v: number) => void;
  onStart: () => void;
  maxAttempts: number;
}) {
  const canPlay = bet > 0 && bet <= balance;
  return (
    <ScrollView contentContainerStyle={styles.lobby}>
      <View style={styles.balanceRow}>
        <Ionicons name="wallet" size={16} color="#7BD9CB" />
        <Text style={styles.balanceText}>Saldo: {money(balance)}</Text>
      </View>

      <View style={styles.rulesCard}>
        <Text style={styles.rulesTitle}>Como funciona</Text>
        <Text style={styles.rulesLine}>· Escolha um valor e aposte para começar.</Text>
        <Text style={styles.rulesLine}>· Feche todos os pares e receba o dobro.</Text>
        <Text style={styles.rulesLine}>
          · Errar {maxAttempts} {maxAttempts === 1 ? 'vez' : 'vezes'} encerra a partida — e a aposta
          vai embora.
        </Text>
      </View>

      <Text style={styles.betLabel}>Sua aposta</Text>
      <View style={styles.chips}>
        {BET_CHIPS.map((v) => {
          const disabled = v > balance;
          const active = bet === v;
          return (
            <Pressable
              key={v}
              disabled={disabled}
              onPress={() => onBet(v)}
              style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive, disabled && styles.chipTextDisabled]}>
                {money(v)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {balance < BET_CHIPS[0] ? (
        <Text style={styles.noFunds}>Saldo insuficiente para apostar.</Text>
      ) : null}

      <Pressable
        style={[styles.playBtn, !canPlay && styles.playBtnDisabled]}
        disabled={!canPlay}
        onPress={onStart}
      >
        <Ionicons name="dice" size={17} color={canPlay ? '#06231F' : theme.colors.textFaint} />
        <Text style={[styles.playText, !canPlay && styles.playTextDisabled]}>
          {canPlay ? `Apostar ${money(bet)} e jogar` : 'Escolha um valor'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

function ResultCard({
  icon,
  color,
  title,
  detail,
  actionLabel,
  onAction,
  onBank,
}: {
  icon: IconName;
  color: string;
  title: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
  onBank: () => void;
}) {
  return (
    <View style={styles.winCard}>
      <Ionicons name={icon} size={30} color={color} />
      <Text style={styles.winTitle}>{title}</Text>
      <Text style={styles.winSub}>{detail}</Text>
      <Pressable style={styles.winBtn} onPress={onAction}>
        <Text style={styles.winBtnText}>{actionLabel}</Text>
      </Pressable>
      <Pressable onPress={onBank} hitSlop={8}>
        <Text style={styles.bankLink}>Ver extrato no Tulu Bank</Text>
      </Pressable>
    </View>
  );
}

function MemoryCard({ card, faceUp, onPress }: { card: Card; faceUp: boolean; onPress: () => void }) {
  // 2D flip (scaleX squeeze + content swap at the midpoint) — reliable on
  // Android, where rotateY + backfaceVisibility renders inconsistently.
  const [shown, setShown] = useState(faceUp);
  const scaleX = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (shown === faceUp) return;
    Animated.timing(scaleX, { toValue: 0, duration: 90, useNativeDriver: true }).start(() => {
      setShown(faceUp);
      Animated.timing(scaleX, { toValue: 1, duration: 90, useNativeDriver: true }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceUp]);

  return (
    <Pressable style={styles.cell} onPress={onPress}>
      <Animated.View
        style={[
          styles.face,
          shown ? styles.front : styles.back,
          card.matched && shown && styles.matched,
          { transform: [{ scaleX }] },
        ]}
      >
        {shown ? (
          <Ionicons name={card.face} size={26} color={card.matched ? '#06231F' : theme.colors.text} />
        ) : (
          <Ionicons name="help" size={20} color={theme.colors.textFaint} />
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },

  lobby: { padding: 18, paddingBottom: 30 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 14 },
  balanceText: { color: theme.colors.text, fontSize: 14.5, fontWeight: '700' },

  rulesCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  rulesTitle: { color: theme.colors.text, fontSize: 13.5, fontWeight: '800', marginBottom: 6 },
  rulesLine: { color: theme.colors.textDim, fontSize: 13, lineHeight: 20 },

  betLabel: {
    color: theme.colors.textDim,
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 20,
    marginBottom: 10,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    borderRadius: 999,
    paddingVertical: 9,
    paddingHorizontal: 18,
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipActive: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },
  chipDisabled: { opacity: 0.45 },
  chipText: { color: theme.colors.text, fontSize: 13.5, fontWeight: '700' },
  chipTextActive: { color: '#06231F' },
  chipTextDisabled: { color: theme.colors.textFaint },

  noFunds: { color: '#E4708A', fontSize: 12.5, marginTop: 12 },

  playBtn: {
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.colors.accent,
    borderRadius: 999,
    paddingVertical: 13,
  },
  playBtnDisabled: { backgroundColor: theme.colors.surfaceAlt },
  playText: { color: '#06231F', fontSize: 14.5, fontWeight: '800' },
  playTextDisabled: { color: theme.colors.textFaint },

  heartsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginTop: 12,
  },
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 10,
    justifyContent: 'center',
    marginTop: 4,
  },
  cell: { width: '21%', aspectRatio: 0.78 },
  face: {
    flex: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    backgroundColor: theme.colors.surfaceAlt,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  front: {
    backgroundColor: theme.colors.surfaceHigh,
    borderWidth: 1,
    borderColor: theme.colors.accentDim,
  },
  matched: { backgroundColor: theme.colors.accent, borderColor: theme.colors.accent },

  winCard: {
    margin: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    padding: 22,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  winTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800', marginTop: 10 },
  winSub: { color: theme.colors.textDim, fontSize: 13, marginTop: 4 },
  winBtn: {
    marginTop: 16,
    backgroundColor: theme.colors.accentDim,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 28,
  },
  winBtnText: { color: theme.colors.text, fontSize: 14, fontWeight: '700' },
  bankLink: { color: '#7BD9CB', fontSize: 12.5, marginTop: 14, fontWeight: '600' },
});
