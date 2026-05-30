import { View, Text } from 'react-native';

export default function NewExpenseScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a2e', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ color: 'white' }}>New Expense</Text>
    </View>
  );
}