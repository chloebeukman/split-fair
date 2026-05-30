import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../context/AppContext';

export default function PeopleScreen() {
  const { people, addPerson, removePerson } = useApp();
  const [name, setName] = useState('');

  const handleAdd = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (people.find(p => p.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Duplicate', 'Someone with that name is already in the group.');
      return;
    }
    addPerson(trimmed);
    setName('');
  };

  const handleRemove = (id: string, personName: string) => {
    Alert.alert(
      'Remove Person',
      `Remove ${personName} from the group? This won't affect existing expenses.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removePerson(id) },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>People</Text>
        <Text style={styles.subtitle}>Add everyone splitting expenses</Text>

        {/* Add Person Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter a name..."
            placeholderTextColor="#555"
            value={name}
            onChangeText={setName}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* People List */}
        {people.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>No one added yet</Text>
            <Text style={styles.emptyHint}>Add names above to get started</Text>
          </View>
        ) : (
          <View style={styles.card}>
            {people.map((person, index) => (
              <View key={person.id}>
                {index > 0 && <View style={styles.divider} />}
                <View style={styles.personRow}>
                  <View style={[styles.dot, { backgroundColor: person.color }]} />
                  <Text style={styles.personName}>{person.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemove(person.id, person.name)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.tip}>
          💡 Tip: Add everyone before creating expenses. Colors are assigned automatically.
        </Text>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { padding: 20, paddingBottom: 60 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', marginTop: 20 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 24 },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  input: {
    flex: 1, backgroundColor: '#16213e', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    color: 'white', fontSize: 16,
  },
  addButton: {
    backgroundColor: '#7C3AED', borderRadius: 12,
    width: 52, justifyContent: 'center', alignItems: 'center',
  },
  card: { backgroundColor: '#16213e', borderRadius: 16, padding: 8, marginBottom: 24 },
  personRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 12, gap: 12,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  personName: { flex: 1, color: 'white', fontSize: 16 },
  divider: { height: 1, backgroundColor: '#ffffff10', marginHorizontal: 12 },
  emptyCard: {
    backgroundColor: '#16213e', borderRadius: 16, padding: 40,
    alignItems: 'center', gap: 8, marginBottom: 24,
  },
  emptyText: { color: '#888', fontSize: 16, marginTop: 8 },
  emptyHint: { color: '#555', fontSize: 13 },
  tip: { color: '#555', fontSize: 13, textAlign: 'center', lineHeight: 20 },
});