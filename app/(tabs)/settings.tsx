import { Ionicons } from '@expo/vector-icons';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CURRENCY_SYMBOLS, Currency, useApp } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

export default function SettingsScreen() {
  const {
    activeGroup,
    setCurrency,
    setCurrentUserId,
    resetActiveGroup,
  } = useApp();

  const currencies: Currency[] = ['ZAR', 'USD', 'EUR', 'GBP'];

  if (!activeGroup) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyCard}>
          <Ionicons name="settings-outline" size={48} color="#444" />
          <Text style={styles.emptyText}>No group selected</Text>
          <Text style={styles.emptyHint}>Create a group to get started</Text>
        </View>
      </View>
    );
  }

  const { people, currentUserId, currency } = activeGroup;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.groupName}>Group: {activeGroup.name}</Text>

        {/* Who Am I */}
        <Text style={styles.sectionTitle}>Who am I?</Text>
        <Text style={styles.sectionHint}>
          Select yourself so the app knows your balance
        </Text>
        {people.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No people added yet</Text>
            <Text style={styles.emptyHint}>Go to the People tab first</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {people.map((person, index) => (
              <View key={person.id}>
                {index > 0 && <View style={styles.divider} />}
                <TouchableOpacity
                  style={[styles.row, currentUserId === person.id && styles.rowActive]}
                  onPress={() => setCurrentUserId(person.id)}
                >
                  <View style={[styles.dot, { backgroundColor: person.color }]} />
                  <Text style={styles.rowText}>{person.name}</Text>
                  {currentUserId === person.id && (
                    <Ionicons name="checkmark-circle" size={22} color="#7C3AED" />
                  )}
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Currency */}
        <Text style={styles.sectionTitle}>Currency</Text>
        <Text style={styles.sectionHint}>
          Choose your preferred currency for this group
        </Text>
        <View style={styles.card}>
          {currencies.map((c, index) => (
            <View key={c}>
              {index > 0 && <View style={styles.divider} />}
              <TouchableOpacity
                style={[styles.row, currency === c && styles.rowActive]}
                onPress={() => setCurrency(c)}
              >
                <Text style={styles.currencySymbol}>{CURRENCY_SYMBOLS[c]}</Text>
                <Text style={styles.rowText}>{c}</Text>
                {currency === c && (
                  <Ionicons name="checkmark-circle" size={22} color="#7C3AED" />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Danger Zone */}
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={() => setCurrentUserId(null)}
          >
            <Ionicons name="person-remove-outline" size={20} color="#FF6B6B" />
            <Text style={[styles.rowText, { color: '#FF6B6B' }]}>Clear "who am I" selection</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              Alert.alert(
                'Reset Group',
                `This will delete all people and expenses in "${activeGroup.name}". This cannot be undone.`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: resetActiveGroup,
                  },
                ]
              );
            }}
          >
            <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
            <Text style={[styles.rowText, { color: '#FF6B6B' }]}>Reset this group</Text>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.row}
            onPress={() => {
              Alert.alert(
                'Sign Out',
                'Are you sure you want to sign out?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                      await supabase.auth.signOut();
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
            <Text style={[styles.rowText, { color: '#FF6B6B' }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', marginTop: 20, marginBottom: 4 },
  groupName: { fontSize: 14, color: '#7C3AED', marginBottom: 24, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: 'white', marginBottom: 6, marginTop: 8 },
  sectionHint: { fontSize: 13, color: '#555', marginBottom: 12 },
  card: { backgroundColor: '#16213e', borderRadius: 16, overflow: 'hidden', marginBottom: 24 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  rowActive: { backgroundColor: '#7C3AED22' },
  rowText: { flex: 1, color: 'white', fontSize: 16 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  currencySymbol: { width: 24, color: '#888', fontSize: 16, fontWeight: '600' },
  divider: { height: 1, backgroundColor: '#ffffff10' },
  emptyCard: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 24,
    alignItems: 'center', gap: 6, marginBottom: 24,
  },
  emptyText: { color: '#888', fontSize: 15 },
  emptyHint: { color: '#555', fontSize: 13 },
});