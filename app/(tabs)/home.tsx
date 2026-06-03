import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { calculateBalances, calculateSettlements, CURRENCY_SYMBOLS, useApp } from '../../context/AppContext';

export default function HomeScreen() {
  const { people, expenses, currency, currentUserId } = useApp();
  const router = useRouter();
  const sym = CURRENCY_SYMBOLS[currency];

  const balances = calculateBalances(expenses, people);
  const settlements = calculateSettlements(balances);

  const userBalance = currentUserId ? (balances[currentUserId] ?? 0) : 0;
  const totalOwed = userBalance < 0 ? Math.abs(userBalance) : 0;
  const totalOwedToYou = userBalance > 0 ? userBalance : 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Header */}
        <Text style={styles.appTitle}>Split Fair</Text>
        <Text style={styles.appSubtitle}>Group expense tracking made simple</Text>

        {/* Summary Cards */}
        <View style={styles.cardRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="trending-down" size={24} color="#FF6B6B" />
            <Text style={styles.summaryAmount}>{sym}{totalOwed.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>You owe</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="trending-up" size={24} color="#4ECDC4" />
            <Text style={styles.summaryAmount}>{sym}{totalOwedToYou.toFixed(2)}</Text>
            <Text style={styles.summaryLabel}>Owed to you</Text>
          </View>
        </View>

        {/* Balances */}
        <Text style={styles.sectionTitle}>Balances</Text>
        {people.length === 0 ? (
          <View style={styles.gettingStarted}>
            <Text style={styles.gettingStartedTitle}>Get Started in 3 Steps</Text>

            <TouchableOpacity style={styles.stepButton} onPress={() => router.push('/people')}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Add your group</Text>
                <Text style={styles.stepHint}>Add everyone splitting expenses</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#555" />
            </TouchableOpacity>

            <View style={styles.stepDivider} />

            <TouchableOpacity style={styles.stepButton} onPress={() => router.push('/settings')}>
              <View style={[styles.stepNumber, { backgroundColor: '#4ECDC422', borderColor: '#4ECDC4' }]}>
                <Text style={[styles.stepNumberText, { color: '#4ECDC4' }]}>2</Text>
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitle}>Select yourself</Text>
                <Text style={styles.stepHint}>So the app knows your balance</Text>
              </View>
            <Ionicons name="chevron-forward" size={18} color="#555" />
          </TouchableOpacity>

          <View style={styles.stepDivider} />

          <TouchableOpacity style={styles.stepButton} onPress={() => router.push('/expense/new')}>
            <View style={[styles.stepNumber, { backgroundColor: '#FF6B9D22', borderColor: '#FF6B9D' }]}>
              <Text style={[styles.stepNumberText, { color: '#FF6B9D' }]}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Add your first expense</Text>
              <Text style={styles.stepHint}>Split a bill between your group</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#555" />
          </TouchableOpacity>
        </View>

        ) : (
          <View style={styles.card}>
            {people.map(person => {
              const balance = balances[person.id] ?? 0;
              return (
                <View key={person.id} style={styles.balanceRow}>
                  <View style={[styles.dot, { backgroundColor: person.color }]} />
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={[styles.balanceAmount, { color: balance >= 0 ? '#4ECDC4' : '#FF6B6B' }]}>
                    {balance >= 0 ? '+' : ''}{sym}{balance.toFixed(2)}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Expenses */}
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        {expenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No expenses yet.</Text>
            <Text style={styles.emptyHint}>Tap + to add your first expense.</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {[...expenses].reverse().slice(0, 5).map(expense => {
              const payer = people.find(p => p.id === expense.paidById);
              const total = expense.items.reduce((sum, item) => sum + item.amount, 0) * (1 + expense.tipPercent / 100);
              return (
                <View key={expense.id} style={styles.expenseRow}>
                  <View>
                    <Text style={styles.expenseTitle}>{expense.title}</Text>
                    <Text style={styles.expenseSub}>Paid by {payer?.name ?? 'Unknown'}</Text>
                  </View>
                  <Text style={styles.expenseAmount}>{sym}{total.toFixed(2)}</Text>
                </View>
              );
            })}
          </View>
        )}

      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/expense/new')}>
        <Ionicons name="add" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { padding: 20, paddingBottom: 100 },
  appTitle: { fontSize: 32, fontWeight: 'bold', color: 'white', marginTop: 20 },
  appSubtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  cardRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  summaryCard: {
    flex: 1, backgroundColor: '#16213e', borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 8,
  },
  summaryAmount: { fontSize: 22, fontWeight: 'bold', color: 'white' },
  summaryLabel: { fontSize: 12, color: '#888' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: 'white', marginBottom: 12 },
  card: { backgroundColor: '#16213e', borderRadius: 16, padding: 16, marginBottom: 24 },
  emptyCard: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 24,
    alignItems: 'center', marginBottom: 24,
  },
  emptyText: { color: '#888', fontSize: 14 },
  emptyHint: { color: '#555', fontSize: 12, marginTop: 4 },
  balanceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  personName: { flex: 1, color: 'white', fontSize: 15 },
  balanceAmount: { fontSize: 15, fontWeight: '600' },
  expenseRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
  },
  expenseTitle: { color: 'white', fontSize: 15 },
  expenseSub: { color: '#888', fontSize: 12, marginTop: 2 },
  expenseAmount: { color: 'white', fontSize: 15, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 30, right: 24,
    backgroundColor: '#7C3AED', width: 60, height: 60,
    borderRadius: 30, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },

  gettingStarted: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 8, marginBottom: 24,
  },
  gettingStartedTitle: {
    fontSize: 14, fontWeight: '600', color: '#888',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  stepButton: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 16,
  },
  stepNumber: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#7C3AED22', borderWidth: 1, borderColor: '#7C3AED',
    justifyContent: 'center', alignItems: 'center',
  },
  stepNumberText: { color: '#7C3AED', fontWeight: '700', fontSize: 14 },
  stepContent: { flex: 1 },
  stepTitle: { color: 'white', fontSize: 15, fontWeight: '500' },
  stepHint: { color: '#888', fontSize: 12, marginTop: 2 },
  stepDivider: { height: 1, backgroundColor: '#ffffff10', marginHorizontal: 16 },
});