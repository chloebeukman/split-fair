import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useApp } from '../context/AppContext';

export default function OnboardingScreen() {
  const router = useRouter();
  const { setHasOnboarded, addGroup } = useApp();
  const [groupName, setGroupName] = useState('');

  const steps = [
    {
      icon: 'people-outline',
      color: '#FF6B9D',
      title: 'Add Your Group',
      description: 'Start by adding everyone who is sharing expenses. Each person gets a unique colour so you can track them easily.',
    },
    {
      icon: 'receipt-outline',
      color: '#4ECDC4',
      title: 'Split by Item',
      description: 'Add expenses and split each item between specific people. Not everyone orders the same thing — so why split equally?',
    },
    {
      icon: 'cash-outline',
      color: '#7C3AED',
      title: 'Settle Up Simply',
      description: 'Split Fair calculates the minimum number of payments needed to clear all debts. No mental math, no arguments.',
    },
    {
      icon: 'albums-outline',
      color: '#45B7D1',
      title: 'Multiple Groups',
      description: 'Create separate groups for different trips or friend circles. Each group has its own people, expenses and currency.',
    },
  ];

  const handleGetStarted = async () => {
    const name = groupName.trim() || 'My Group';
    addGroup(name);
    await setHasOnboarded(true);
    router.replace('/home');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>

        <View style={styles.header}>
          <Text style={styles.emoji}>🤝💸</Text>
          <Text style={styles.title}>Welcome to Split Fair</Text>
          <Text style={styles.subtitle}>Fair splits, every time.</Text>
        </View>

        {steps.map((step, index) => (
          <View key={index} style={styles.stepCard}>
            <View style={[styles.iconCircle, { backgroundColor: step.color + '22', borderColor: step.color }]}>
              <Ionicons name={step.icon as any} size={28} color={step.color} />
            </View>
            <View style={styles.stepText}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDescription}>{step.description}</Text>
            </View>
          </View>
        ))}

        {/* First Group Name */}
        <View style={styles.groupNameSection}>
          <Text style={styles.groupNameLabel}>Name your first group</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Cape Town Trip, Regular Friends..."
            placeholderTextColor="#555"
            value={groupName}
            onChangeText={setGroupName}
            returnKeyType="done"
          />
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleGetStarted}>
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  scroll: { padding: 24, paddingBottom: 120 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#888', marginTop: 8, textAlign: 'center' },
  stepCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 16,
    backgroundColor: '#16213e', borderRadius: 16, padding: 20, marginBottom: 16,
  },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  stepText: { flex: 1 },
  stepTitle: { fontSize: 17, fontWeight: '600', color: 'white', marginBottom: 6 },
  stepDescription: { fontSize: 14, color: '#888', lineHeight: 20 },
  groupNameSection: { marginTop: 8 },
  groupNameLabel: { fontSize: 16, fontWeight: '600', color: 'white', marginBottom: 12 },
  input: {
    backgroundColor: '#16213e', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    color: 'white', fontSize: 16,
  },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 24, backgroundColor: '#1a1a2e',
  },
  button: {
    backgroundColor: '#7C3AED', borderRadius: 16, padding: 18,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  buttonText: { color: 'white', fontSize: 17, fontWeight: '700' },
});