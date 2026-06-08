import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';

export default function GroupsScreen() {
  const { groups, activeGroupId, addGroup, removeGroup, renameGroup, setActiveGroupId } = useApp();
  const router = useRouter();
  const [newGroupName, setNewGroupName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleAdd = () => {
    const trimmed = newGroupName.trim();
    if (!trimmed) return;
    if (groups.find(g => g.name.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Duplicate', 'A group with that name already exists.');
      return;
    }
    addGroup(trimmed);
    setNewGroupName('');
    Alert.alert(
      'Group Created!',
      `"${trimmed}" is ready. Add people to get started.`,
      [
        {
          text: 'Add People',
          onPress: () => router.replace('/people'),
        },
        { text: 'Later', style: 'cancel' },
      ]
    );
  };

  const handleRemove = (id: string, name: string) => {
    if (groups.length === 1) {
      Alert.alert('Cannot delete', 'You need at least one group.');
      return;
    }
    Alert.alert(
      'Delete Group',
      `Delete "${name}" and all its people and expenses? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => removeGroup(id) },
      ]
    );
  };

  const handleRename = (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;
    renameGroup(id, trimmed);
    setEditingId(null);
    setEditingName('');
  };

  const handleSelect = (id: string) => {
    setActiveGroupId(id);
    router.back();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.title}>My Groups</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.hint}>
          Each group has its own people, expenses and currency. Switch between groups anytime.
        </Text>

        {/* Add Group */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="New group name..."
            placeholderTextColor="#555"
            value={newGroupName}
            onChangeText={setNewGroupName}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
          />
          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* Groups List */}
        <View style={styles.card}>
          {groups.map((group, index) => (
            <View key={group.id}>
              {index > 0 && <View style={styles.divider} />}
              {editingId === group.id ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                    value={editingName}
                    onChangeText={setEditingName}
                    onSubmitEditing={() => handleRename(group.id)}
                    autoFocus
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={styles.saveEditButton}
                    onPress={() => handleRename(group.id)}
                  >
                    <Ionicons name="checkmark" size={20} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.cancelEditButton}
                    onPress={() => setEditingId(null)}
                  >
                    <Ionicons name="close" size={20} color="#888" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.groupRow, activeGroupId === group.id && styles.groupRowActive]}
                  onPress={() => handleSelect(group.id)}
                >
                  <View style={styles.groupInfo}>
                    {activeGroupId === group.id && (
                      <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />
                    )}
                    {activeGroupId !== group.id && (
                      <Ionicons name="ellipse-outline" size={20} color="#444" />
                    )}
                    <View>
                      <Text style={styles.groupName}>{group.name}</Text>
                      <Text style={styles.groupMeta}>
                        {group.people.length} {group.people.length === 1 ? 'person' : 'people'} · {group.expenses.length} {group.expenses.length === 1 ? 'expense' : 'expenses'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.groupActions}>
                    <TouchableOpacity
                      onPress={() => { setEditingId(group.id); setEditingName(group.name); }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="pencil-outline" size={18} color="#4ECDC4" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleRemove(group.id, group.name)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { padding: 20, paddingBottom: 60 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: 'bold', color: 'white' },
  hint: { fontSize: 13, color: '#555', marginBottom: 24, lineHeight: 20 },
  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  input: { flex: 1, backgroundColor: '#16213e', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: 'white', fontSize: 16 },
  addButton: { backgroundColor: '#7C3AED', borderRadius: 12, width: 52, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#16213e', borderRadius: 16, overflow: 'hidden' },
  divider: { height: 1, backgroundColor: '#ffffff10' },
  groupRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  groupRowActive: { backgroundColor: '#7C3AED22' },
  groupInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  groupName: { color: 'white', fontSize: 16, fontWeight: '500' },
  groupMeta: { color: '#555', fontSize: 12, marginTop: 2 },
  groupActions: { flexDirection: 'row', gap: 16 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12 },
  saveEditButton: { backgroundColor: '#7C3AED', borderRadius: 10, padding: 10 },
  cancelEditButton: { padding: 10 },
});