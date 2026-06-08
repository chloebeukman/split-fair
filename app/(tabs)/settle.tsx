import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { calculateBalances, calculateSettlements, CURRENCY_SYMBOLS, useApp } from '../../context/AppContext';

export default function SettleScreen() {
  const { activeGroup } = useApp();
  const router = useRouter();

if (!activeGroup) {
    return (
      <View style={styles.container}>
        <View style={styles.scroll}>
          <Text style={styles.title}>Settle Up</Text>
        </View>
        <View style={styles.centeredEmpty}>
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>No group selected</Text>
            <Text style={styles.emptyHint}>Go to Home to create a group</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => router.push('/home')}>
              <Text style={styles.createButtonText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const { people, expenses, currency } = activeGroup;
  const sym = CURRENCY_SYMBOLS[currency];
  const balances = calculateBalances(expenses, people);
  const settlements = calculateSettlements(balances);
  const getPerson = (id: string) => people.find(p => p.id === id);

  const handleShare = async () => {
    if (settlements.length === 0) return;
    const lines: string[] = [];
    lines.push('💸 Split Fair — Settle Up Summary');
    lines.push('');
    settlements.forEach(s => {
      const from = getPerson(s.fromId);
      const to = getPerson(s.toId);
      if (from && to) {
        lines.push(`${from.name} owes ${to.name} ${sym}${s.amount.toFixed(2)}`);
      }
    });
    lines.push('');
    lines.push('Individual balances:');
    people.forEach(person => {
      const balance = balances[person.id] ?? 0;
      const status = Math.abs(balance) < 0.01
        ? 'settled up ✅'
        : balance > 0
          ? `gets back ${sym}${balance.toFixed(2)}`
          : `owes ${sym}${Math.abs(balance).toFixed(2)}`;
      lines.push(`${person.name}: ${status}`);
    });
    lines.push('');
    lines.push('Shared via Split Fair');
    await Share.share({ message: lines.join('\n') });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Settle Up</Text>
            <Text style={styles.subtitle}>Minimum transactions to clear all debts</Text>
          </View>
          {settlements.length > 0 && (
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={20} color="#7C3AED" />
            </TouchableOpacity>
          )}
        </View>

        {people.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>No people added yet</Text>
            <Text style={styles.emptyHint}>Add people and expenses to see settlements</Text>
          </View>
        ) : expenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptyHint}>Add expenses to calculate who owes what</Text>
          </View>
        ) : settlements.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#4ECDC4" />
            <Text style={[styles.emptyText, { color: '#4ECDC4' }]}>All settled up!</Text>
            <Text style={styles.emptyHint}>No payments needed</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              {settlements.map((settlement, index) => {
                const from = getPerson(settlement.fromId);
                const to = getPerson(settlement.toId);
                if (!from || !to) return null;
                return (
                  <View key={index}>
                    {index > 0 && <View style={styles.divider} />}
                    <View style={styles.settlementRow}>
                      <View style={styles.personSection}>
                        <View style={[styles.dot, { backgroundColor: from.color }]} />
                        <Text style={styles.personName}>{from.name}</Text>
                      </View>
                      <View style={styles.arrowSection}>
                        <Text style={styles.amount}>{sym}{settlement.amount.toFixed(2)}</Text>
                        <Ionicons name="arrow-forward" size={16} color="#7C3AED" />
                      </View>
                      <View style={styles.personSection}>
                        <View style={[styles.dot, { backgroundColor: to.color }]} />
                        <Text style={styles.personName}>{to.name}</Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            <Text style={styles.sectionTitle}>Individual Balances</Text>
            <View style={styles.card}>
              {people.map((person, index) => {
                const balance = balances[person.id] ?? 0;
                return (
                  <View key={person.id}>
                    {index > 0 && <View style={styles.divider} />}
                    <View style={styles.balanceRow}>
                      <View style={[styles.dot, { backgroundColor: person.color }]} />
                      <Text style={styles.personName}>{person.name}</Text>
                      <View style={styles.balanceRight}>
                        <Text style={[styles.balanceAmount, { color: balance >= 0 ? '#4ECDC4' : '#FF6B6B' }]}>
                          {balance >= 0 ? '+' : ''}{sym}{balance.toFixed(2)}
                        </Text>
                        <Text style={styles.balanceStatus}>
                          {Math.abs(balance) < 0.01 ? 'settled' : balance > 0 ? 'gets back' : 'owes'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { padding: 20, paddingBottom: 60 },
  titleRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', marginBottom: 24,
  },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', marginTop: 20 },
  subtitle: { fontSize: 14, color: '#888' },
  shareButton: {
    backgroundColor: '#7C3AED22', borderRadius: 12,
    padding: 10, borderWidth: 1, borderColor: '#7C3AED',
    marginTop: 20,
  },
  emptyCard: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 40,
    alignItems: 'center', gap: 8,
  },
  createButton: {
    marginTop: 12, backgroundColor: '#7C3AED',
    borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  createButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },
  emptyText: { color: '#888', fontSize: 16, marginTop: 8 },
  emptyHint: { color: '#555', fontSize: 13, textAlign: 'center' },
  card: { backgroundColor: '#16213e', borderRadius: 16, padding: 8, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: 'white', marginBottom: 12 },
  settlementRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', padding: 16,
  },
  personSection: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  arrowSection: { alignItems: 'center', gap: 4, paddingHorizontal: 8 },
  amount: { color: '#7C3AED', fontWeight: '700', fontSize: 14 },
  personName: { color: 'white', fontSize: 15 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  divider: { height: 1, backgroundColor: '#ffffff10', marginHorizontal: 12 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  balanceRight: { marginLeft: 'auto', alignItems: 'flex-end' },
  balanceAmount: { fontSize: 15, fontWeight: '600' },
  balanceStatus: { fontSize: 11, color: '#555', marginTop: 2 },
  centeredEmpty: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
});