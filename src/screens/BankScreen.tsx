import React, { useState } from 'react';
import { View, Text, Pressable, FlatList, Modal, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '@/theme';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useGameStore } from '@/store/gameStore';
import { useUiStore } from '@/store/uiStore';
import { money, stamp, firstName } from '@/utils/format';
import { findByBankAccount, maskedName } from '@/utils/people';
import type { BankTransaction } from '@/types/game';
import type { Screen } from '@/navigation/types';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const TINT = '#00796B';

/** Quick actions; "Transferir" is real, the others politely fail. */
const ACTIONS: { icon: IconName; label: string }[] = [
  { icon: 'swap-horizontal', label: 'Transferir' },
  { icon: 'qr-code', label: 'Pagar' },
  { icon: 'phone-portrait', label: 'Recarga' },
  { icon: 'card', label: 'Cartões' },
];

/**
 * "Tulu Bank" — the player's bank app. The balance is real game state: it is
 * earned betting on Pares or received from characters (a `money` story effect)
 * and some story points require a minimum balance to proceed.
 */
export function BankScreen({ navigation }: Screen<'Bank'>) {
  const state = useGameStore((s) => s.state);
  const showDialog = useUiStore((s) => s.showDialog);
  const [hidden, setHidden] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  if (!state) return null;

  const statement = [...state.transactions].reverse();

  return (
    <View style={styles.bg}>
      <ScreenHeader
        title="Tulu Bank"
        subtitle="Agência 0001 · Conta 84312-5"
        icon="wallet"
        tint={TINT}
        onBack={() => navigation.navigate('Home')}
      />

      <FlatList
        data={statement}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {/* Balance card */}
            <LinearGradient colors={['#00564C', '#0B2E2A']} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardLabel}>Saldo disponível</Text>
                <Pressable onPress={() => setHidden(!hidden)} hitSlop={10}>
                  <Ionicons name={hidden ? 'eye-off' : 'eye'} size={18} color="rgba(255,255,255,0.7)" />
                </Pressable>
              </View>
              <Text style={styles.balance}>{hidden ? 'R$ ••••' : money(state.money)}</Text>
              <View style={styles.cardBottom}>
                <Text style={styles.holder}>{state.playerName}</Text>
                <Text style={styles.cardKind}>Conta Corrente</Text>
              </View>
            </LinearGradient>

            {/* Quick actions — phone-style "unavailable" popups keep it honest */}
            <View style={styles.actions}>
              {ACTIONS.map((a) => (
                <Pressable
                  key={a.label}
                  style={styles.action}
                  onPress={() =>
                    a.label === 'Transferir'
                      ? setTransferOpen(true)
                      : showDialog(
                          `${a.label} está temporariamente indisponível. Tente novamente mais tarde.`,
                        )
                  }
                >
                  <View style={styles.actionIcon}>
                    <Ionicons name={a.icon} size={19} color="#7BD9CB" />
                  </View>
                  <Text style={styles.actionLabel}>{a.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Extrato</Text>
            {statement.length === 0 ? (
              <Text style={styles.empty}>
                Nenhuma movimentação ainda, {firstName(state.playerName)}.
              </Text>
            ) : null}
          </>
        }
        renderItem={({ item }) => <TransactionRow tx={item} />}
      />

      <TransferModal visible={transferOpen} onClose={() => setTransferOpen(false)} />
    </View>
  );
}

/**
 * Pix-style transfer: type the destination account number (a character may
 * have texted theirs), the bank resolves the masked holder name, confirm the
 * amount. Transfers accumulate per character so the story can react
 * (`paidAtLeast` condition).
 */
function TransferModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const state = useGameStore((s) => s.state);
  const bankTransfer = useGameStore((s) => s.bankTransfer);
  const showDialog = useUiStore((s) => s.showDialog);
  const [account, setAccount] = useState('');
  const [raw, setRaw] = useState('');

  if (!state) return null;

  const recipient = findByBankAccount(account);
  const accountTyped = account.replace(/\D/g, '').length >= 4;
  const holder =
    recipient &&
    (state.unlockedContacts.includes(recipient.id)
      ? recipient.name
      : maskedName(recipient.fullName || recipient.name));

  const value = Math.round(parseFloat(raw.replace(',', '.')) * 100) / 100 || 0;
  const insufficient = value > state.money;
  const canSend = Boolean(recipient && holder && value > 0 && !insufficient);

  const reset = () => {
    setAccount('');
    setRaw('');
    onClose();
  };

  const send = () => {
    if (!recipient || !holder || !canSend) return;
    bankTransfer(recipient.id, value, `Transferência para ${holder}`);
    reset();
    showDialog(`Transferência de ${money(value)} para ${holder} realizada.`);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={reset}>
      <Pressable style={styles.modalBackdrop} onPress={reset}>
        <Pressable style={styles.modalCard} onPress={() => {}}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>Transferência</Text>
            <Pressable onPress={reset} hitSlop={10}>
              <Ionicons name="close" size={20} color={theme.colors.textDim} />
            </Pressable>
          </View>

          <Text style={styles.fieldLabel}>Conta de destino</Text>
          <TextInput
            style={styles.input}
            value={account}
            onChangeText={setAccount}
            placeholder="ex.: 21407-3"
            placeholderTextColor={theme.colors.textFaint}
            keyboardType="numbers-and-punctuation"
            autoCorrect={false}
          />

          {accountTyped ? (
            recipient ? (
              <View style={styles.holderRow}>
                <Ionicons name="checkmark-circle" size={15} color="#5BD6A0" />
                <Text style={styles.holderText}>
                  {holder} · Tulu Bank
                </Text>
              </View>
            ) : (
              <View style={styles.holderRow}>
                <Ionicons name="alert-circle" size={15} color={theme.colors.danger} />
                <Text style={styles.holderMissing}>Conta não encontrada.</Text>
              </View>
            )
          ) : null}

          <Text style={styles.fieldLabel}>Valor</Text>
          <TextInput
            style={styles.input}
            value={raw}
            onChangeText={setRaw}
            placeholder="0,00"
            placeholderTextColor={theme.colors.textFaint}
            keyboardType="decimal-pad"
          />
          <Text style={[styles.balanceHint, insufficient && styles.balanceBad]}>
            {insufficient
              ? 'Saldo insuficiente para esta transferência.'
              : `Saldo disponível: ${money(state.money)}`}
          </Text>

          <Pressable
            style={[styles.sendBtn, !canSend && styles.sendBtnOff]}
            disabled={!canSend}
            onPress={send}
          >
            <Text style={styles.sendBtnText}>
              {value > 0 ? `Transferir ${money(value)}` : 'Transferir'}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function TransactionRow({ tx }: { tx: BankTransaction }) {
  const credit = tx.amount > 0;
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: credit ? '#103B2C' : '#3B1D22' }]}>
        <Ionicons
          name={credit ? 'arrow-down' : 'arrow-up'}
          size={15}
          color={credit ? '#5BD6A0' : '#E4708A'}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txLabel} numberOfLines={1}>
          {tx.label}
        </Text>
        <Text style={styles.txWhen}>{stamp(tx.at)}</Text>
      </View>
      <Text style={[styles.txAmount, { color: credit ? '#5BD6A0' : '#E4708A' }]}>
        {credit ? '+' : ''}
        {money(tx.amount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: 16, paddingBottom: 30 },

  card: { borderRadius: 20, padding: 18 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 12.5, fontWeight: '600' },
  balance: { color: '#FFFFFF', fontSize: 34, fontWeight: '800', marginTop: 6 },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 18,
  },
  holder: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },
  cardKind: { color: 'rgba(255,255,255,0.55)', fontSize: 11.5 },

  actions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  action: { alignItems: 'center', width: '23%' },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  actionLabel: { color: theme.colors.textDim, fontSize: 11.5, marginTop: 6 },

  sectionTitle: {
    color: theme.colors.textDim,
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 22,
    marginBottom: 10,
  },
  empty: { color: theme.colors.textFaint, fontSize: 13 },

  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  txIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txLabel: { color: theme.colors.text, fontSize: 14, fontWeight: '600' },
  txWhen: { color: theme.colors.textFaint, fontSize: 11.5, marginTop: 1 },
  txAmount: { fontSize: 14, fontWeight: '800' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  modalHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  modalTitle: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
  fieldLabel: { color: theme.colors.textDim, fontSize: 12, fontWeight: '700', marginTop: 14, marginBottom: 6 },
  input: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.colors.text,
    fontSize: 15,
  },
  holderRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  holderText: { color: '#5BD6A0', fontSize: 13, fontWeight: '600', flex: 1 },
  holderMissing: { color: theme.colors.danger, fontSize: 13 },
  balanceHint: { color: theme.colors.textFaint, fontSize: 12, marginTop: 8 },
  balanceBad: { color: theme.colors.danger },
  sendBtn: {
    marginTop: 16,
    backgroundColor: TINT,
    borderRadius: theme.radius.sm,
    alignItems: 'center',
    paddingVertical: 13,
  },
  sendBtnOff: { opacity: 0.4 },
  sendBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});
