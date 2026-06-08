import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../../context/AppContext';

export default function PeopleScreen() {
  const { activeGroup, addPerson, removePerson } = useApp();
  const router = useRouter();
  const [name, setName] = useState('');

  const people = activeGroup?.people ?? [];

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

if (!activeGroup) {
    return (
      <View style={styles.container}>
        <View style={styles.scroll}>
          <Text style={styles.title}>People</Text>
        </View>
        <View style={styles.centeredEmpty}>
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color="#444" />
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

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>People</Text>
        <Text style={styles.subtitle}>Add everyone splitting expenses in {activeGroup.name}</Text>

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

        {people.length > 0 && (
          <View style={styles.nextSteps}>
            <Text style={styles.nextStepsTitle}>Ready to go?</Text>
            <TouchableOpacity style={styles.nextStepButton} onPress={() => router.push('/settings')}>
              <Ionicons name="person-circle-outline" size={20} color="#4ECDC4" />
              <Text style={styles.nextStepText}>Select who you are in Settings</Text>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
            <View style={styles.nextStepDivider} />
            <TouchableOpacity style={styles.nextStepButton} onPress={() => router.push('/expense/new')}>
              <Ionicons name="add-circle-outline" size={20} color="#7C3AED" />
              <Text style={styles.nextStepText}>Add your first expense</Text>
              <Ionicons name="chevron-forward" size={16} color="#555" />
            </TouchableOpacity>
          </View>
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
  nextSteps: {
    backgroundColor: '#16213e', borderRadius: 16,
    padding: 8, marginTop: 16,
  },
  nextStepsTitle: {
    fontSize: 14, fontWeight: '600', color: '#888',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  nextStepButton: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 16,
  },
  nextStepText: { flex: 1, color: 'white', fontSize: 15 },
  nextStepDivider: { height: 1, backgroundColor: '#ffffff10', marginHorizontal: 16 },

  createButton: {
    marginTop: 12, backgroundColor: '#7C3AED',
    borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12,
  },
  createButtonText: { color: 'white', fontSize: 15, fontWeight: '600' },
  centeredEmpty: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20,
  },
});