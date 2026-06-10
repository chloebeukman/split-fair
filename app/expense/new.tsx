import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { CURRENCY_SYMBOLS, ExpenseItem, useApp } from '../../context/AppContext';

export default function NewExpenseScreen() {
  const { activeGroup, addExpense } = useApp();
  const router = useRouter();

  if (!activeGroup) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={48} color="#444" />
          <Text style={styles.emptyText}>No group selected</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { people, currency } = activeGroup;
  const sym = CURRENCY_SYMBOLS[currency];

  if (people.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Ionicons name="people-outline" size={48} color="#444" />
          <Text style={styles.emptyText}>No people added yet</Text>
          <Text style={styles.emptyHint}>Go to the People tab first and add your group.</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <NewExpenseForm people={people} sym={sym} addExpense={addExpense} router={router} />;
}

function newItem(splitBetween: string[]): ExpenseItem {
  return {
    id: Date.now().toString() + Math.random(),
    name: '',
    amount: 0,
    splitBetween,
  };
}

function NewExpenseForm({ people, sym, addExpense, router }: any) {
  const [title, setTitle] = useState('');
  const [tipPercent, setTipPercent] = useState(0);
  const [customTip, setCustomTip] = useState('');
  const [showCustomTip, setShowCustomTip] = useState(false);
  const [paidById, setPaidById] = useState(people[0]?.id ?? '');
  const [items, setItems] = useState<ExpenseItem[]>([newItem(people.map((p: any) => p.id))]);

  const addItem = () => {
    setItems(prev => [...prev, newItem(people.map((p: any) => p.id))]);
  };

  const removeItem = (id: string) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: 'name' | 'amount', value: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (field === 'amount') return { ...item, amount: parseFloat(value) || 0 };
      return { ...item, name: value };
    }));
  };

  const togglePersonOnItem = (itemId: string, personId: string) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const already = item.splitBetween.includes(personId);
      if (already && item.splitBetween.length === 1) return item;
      return {
        ...item,
        splitBetween: already
          ? item.splitBetween.filter(id => id !== personId)
          : [...item.splitBetween, personId],
      };
    }));
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const activeTip = showCustomTip ? (parseFloat(customTip) || 0) : tipPercent;
  const total = subtotal * (1 + activeTip / 100);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please enter a name for this expense.');
      return;
    }
    if (subtotal <= 0) {
      Alert.alert('Missing amount', 'Please enter an amount for at least one item.');
      return;
    }
    if (!paidById) {
      Alert.alert('Missing payer', 'Please select who paid.');
      return;
    }

    await addExpense({
      title: title.trim(),
      items,
      tipPercent: activeTip,
      paidById,
      date: new Date().toISOString(),
    });
    Alert.alert(
        'Expense Added! ✓',
        'What would you like to do next?',
        [
          {
            text: 'Settle Up',
            onPress: () => router.replace('/settle'),
          },
          {
            text: 'Add Another',
            onPress: () => router.replace('/expense/new'),
          },
          {
            text: 'Done',
            onPress: () => router.replace('/home'),
          },
        ]
      );
    };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>New Expense</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.label}>Expense Name</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Dinner, Uber, Groceries..."
          placeholderTextColor="#555"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Items</Text>
        {items.map((item, index) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder={`Item ${index + 1} name`}
                placeholderTextColor="#555"
                value={item.name}
                onChangeText={v => updateItem(item.id, 'name', v)}
              />
              <View style={styles.amountRow}>
                <Text style={styles.currencyLabel}>{sym}</Text>
                <TextInput
                  style={[styles.input, styles.amountInput]}
                  placeholder="0.00"
                  placeholderTextColor="#555"
                  keyboardType="decimal-pad"
                  value={item.amount === 0 ? '' : item.amount.toString()}
                  onChangeText={v => updateItem(item.id, 'amount', v)}
                />
              </View>
              {items.length > 1 && (
                <TouchableOpacity onPress={() => removeItem(item.id)}>
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.splitLabelRow}>
              <Text style={styles.splitLabel}>Split between:</Text>
              <Text style={styles.splitHint}>Tap to remove</Text>
            </View>
            <View style={styles.peopleRow}>
              {people.map((person: any) => {
                const selected = item.splitBetween.includes(person.id);
                return (
                  <TouchableOpacity
                    key={person.id}
                    style={[styles.personChip, selected && { borderColor: person.color, backgroundColor: person.color + '22' }]}
                    onPress={() => togglePersonOnItem(item.id, person.id)}
                  >
                    <View style={[styles.chipDot, { backgroundColor: person.color }]} />
                    <Text style={[styles.chipText, selected && { color: person.color }]}>{person.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.addItemButton} onPress={addItem}>
          <Ionicons name="add" size={18} color="#7C3AED" />
          <Text style={styles.addItemText}>Add another item</Text>
        </TouchableOpacity>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal</Text>
          <Text style={styles.totalValue}>{sym}{subtotal.toFixed(2)}</Text>
        </View>

        <Text style={styles.label}>Tip</Text>
        <View style={styles.tipRow}>
          {[10, 15, 20].map(pct => (
            <TouchableOpacity
              key={pct}
              style={[styles.tipButton, !showCustomTip && tipPercent === pct && styles.tipButtonActive]}
              onPress={() => { setTipPercent(pct); setShowCustomTip(false); }}
            >
              <Text style={[styles.tipPercent, !showCustomTip && tipPercent === pct && styles.tipTextActive]}>{pct}%</Text>
              <Text style={[styles.tipAmount, !showCustomTip && tipPercent === pct && styles.tipTextActive]}>
                {sym}{(subtotal * pct / 100).toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
          style={[styles.customTipButton, showCustomTip && styles.tipButtonActive]}
          onPress={() => { setShowCustomTip(true); setTipPercent(0); }}
        >
          <Text style={[styles.tipPercent, showCustomTip && styles.tipTextActive]}>Custom %</Text>
        </TouchableOpacity>
        {showCustomTip && (
          <TextInput
            style={styles.input}
            placeholder="Enter tip percentage"
            placeholderTextColor="#555"
            keyboardType="decimal-pad"
            value={customTip}
            onChangeText={setCustomTip}
          />
        )}

        <View style={[styles.totalRow, { marginTop: 8 }]}>
          <Text style={[styles.totalLabel, { fontSize: 18 }]}>Total</Text>
          <Text style={[styles.totalValue, { fontSize: 20, color: '#4ECDC4' }]}>{sym}{total.toFixed(2)}</Text>
        </View>

        <Text style={styles.label}>Paid by</Text>
        <View style={styles.card}>
          {people.map((person: any) => (
            <TouchableOpacity
              key={person.id}
              style={[styles.paidByRow, paidById === person.id && styles.paidByRowActive]}
              onPress={() => setPaidById(person.id)}
            >
              <View style={[styles.chipDot, { backgroundColor: person.color }]} />
              <Text style={styles.paidByName}>{person.name}</Text>
              {paidById === person.id && (
                <Ionicons name="checkmark" size={20} color="#7C3AED" />
              )}
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Expense</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { padding: 20, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 24 },
  title: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  label: { fontSize: 14, color: '#888', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#16213e', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: 'white', fontSize: 16, marginBottom: 8 },
  itemCard: { backgroundColor: '#16213e', borderRadius: 16, padding: 16, marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  amountRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  currencyLabel: { color: '#888', fontSize: 16 },
  amountInput: { width: 90, marginBottom: 0 },
  splitLabel: { fontSize: 12, color: '#888' },
  peopleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  personChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#333' },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { color: '#888', fontSize: 13 },
  addItemButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, justifyContent: 'center' },
  addItemText: { color: '#7C3AED', fontSize: 15 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  totalLabel: { color: '#888', fontSize: 15 },
  totalValue: { color: 'white', fontSize: 16, fontWeight: '600' },
  tipRow: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  tipButton: { flex: 1, backgroundColor: '#16213e', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'transparent' },
  tipButtonActive: { borderColor: '#7C3AED', backgroundColor: '#7C3AED22' },
  tipPercent: { color: '#888', fontSize: 15, fontWeight: '600' },
  tipAmount: { color: '#555', fontSize: 12, marginTop: 2 },
  tipTextActive: { color: '#7C3AED' },
  customTipButton: { backgroundColor: '#16213e', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  card: { backgroundColor: '#16213e', borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  paidByRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: '#ffffff10' },
  paidByRowActive: { backgroundColor: '#7C3AED22' },
  paidByName: { flex: 1, color: 'white', fontSize: 16 },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: '#1a1a2e' },
  saveButton: { backgroundColor: '#7C3AED', borderRadius: 16, padding: 18, alignItems: 'center' },
  saveButtonText: { color: 'white', fontSize: 17, fontWeight: '700' },
  emptyText: { color: '#888', fontSize: 16, marginTop: 8 },
  emptyHint: { color: '#555', fontSize: 13, textAlign: 'center' },
  backButton: { marginTop: 16, backgroundColor: '#7C3AED', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  backButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },
  splitLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  splitHint: { fontSize: 11, color: '#7C3AED', fontStyle: 'italic' },
});