import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CURRENCY_SYMBOLS, useApp } from '../../context/AppContext';

export default function ExpensesScreen() {
  const { activeGroup, removeExpense } = useApp();
  const router = useRouter();

  if (!activeGroup) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={48} color="#444" />
          <Text style={styles.emptyText}>No group selected</Text>
          <Text style={styles.emptyHint}>Create a group to get started</Text>
        </View>
      </View>
    );
  }

  const { expenses, people, currency } = activeGroup;
  const sym = CURRENCY_SYMBOLS[currency];

  const handleRemove = (id: string, title: string) => {
    Alert.alert(
      'Delete Expense',
      `Delete "${title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeExpense(id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Expenses</Text>
        <Text style={styles.subtitle}>{expenses.length} expense{expenses.length !== 1 ? 's' : ''} total</Text>

        {expenses.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>No expenses yet</Text>
            <Text style={styles.emptyHint}>Tap + on the Home tab to add one</Text>
          </View>
        ) : (
          [...expenses].reverse().map(expense => {
            const payer = people.find(p => p.id === expense.paidById);
            const subtotal = expense.items.reduce((sum, item) => sum + item.amount, 0);
            const total = subtotal * (1 + expense.tipPercent / 100);
            const date = new Date(expense.date).toLocaleDateString('en-ZA', {
              day: 'numeric', month: 'short', year: 'numeric',
            });

            return (
              <View key={expense.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.expenseTitle}>{expense.title}</Text>
                    <Text style={styles.expenseMeta}>{date} · Paid by {payer?.name ?? 'Unknown'}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 16 }}>
                    <TouchableOpacity
                      onPress={() => router.push(`/expense/edit?id=${expense.id}`)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="pencil-outline" size={18} color="#4ECDC4" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemove(expense.id, expense.title)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </View>

                {expense.items.map(item => {
                  const itemPeople = people.filter(p => item.splitBetween.includes(p.id));
                  return (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.itemName}>{item.name || 'Unnamed item'}</Text>
                        <View style={styles.chipRow}>
                          {itemPeople.map(p => (
                            <View key={p.id} style={[styles.chip, { borderColor: p.color }]}>
                              <View style={[styles.chipDot, { backgroundColor: p.color }]} />
                              <Text style={[styles.chipText, { color: p.color }]}>{p.name}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                      <Text style={styles.itemAmount}>{sym}{item.amount.toFixed(2)}</Text>
                    </View>
                  );
                })}

                {expense.tipPercent > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Tip ({expense.tipPercent}%)</Text>
                    <Text style={styles.summaryValue}>{sym}{(subtotal * expense.tipPercent / 100).toFixed(2)}</Text>
                  </View>
                )}
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{sym}{total.toFixed(2)}</Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', marginTop: 20 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  emptyCard: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 40,
    alignItems: 'center', gap: 8,
  },
  emptyText: { color: '#888', fontSize: 16, marginTop: 8 },
  emptyHint: { color: '#555', fontSize: 13 },
  card: { backgroundColor: '#16213e', borderRadius: 16, padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  expenseTitle: { fontSize: 17, fontWeight: '600', color: 'white' },
  expenseMeta: { fontSize: 12, color: '#888', marginTop: 2 },
  itemRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#ffffff10',
  },
  itemName: { color: '#ccc', fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 20, borderWidth: 1,
  },
  chipDot: { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 11 },
  itemAmount: { color: 'white', fontSize: 14, fontWeight: '500' },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 8, marginTop: 4,
  },
  summaryLabel: { color: '#888', fontSize: 13 },
  summaryValue: { color: '#888', fontSize: 13 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#ffffff10', marginTop: 4 },
  totalLabel: { color: 'white', fontSize: 15, fontWeight: '600' },
  totalValue: { color: '#4ECDC4', fontSize: 15, fontWeight: '700' },
});