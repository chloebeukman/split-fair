import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

// --- TYPES ---
export type Currency = 'ZAR' | 'USD' | 'EUR' | 'GBP';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  ZAR: 'R',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export type Person = {
  id: string;
  name: string;
  color: string;
};

export type ExpenseItem = {
  id: string;
  name: string;
  amount: number;
  splitBetween: string[];
};

export type Expense = {
  id: string;
  title: string;
  items: ExpenseItem[];
  tipPercent: number;
  paidById: string;
  date: string;
};

export type Settlement = {
  fromId: string;
  toId: string;
  amount: number;
};

// --- HELPERS ---
export function calculateBalances(
  expenses: Expense[],
  people: Person[]
): Record<string, number> {
  const balances: Record<string, number> = {};
  people.forEach(p => (balances[p.id] = 0));

  expenses.forEach(expense => {
    const subtotal = expense.items.reduce((sum, item) => sum + item.amount, 0);
    const total = subtotal * (1 + expense.tipPercent / 100);
    const tipMultiplier = 1 + expense.tipPercent / 100;

    balances[expense.paidById] += total;

    expense.items.forEach(item => {
      if (item.splitBetween.length === 0) return;
      const share = (item.amount * tipMultiplier) / item.splitBetween.length;
      item.splitBetween.forEach(personId => {
        balances[personId] -= share;
      });
    });
  });

  return balances;
}

export function calculateSettlements(
  balances: Record<string, number>
): Settlement[] {
  const settlements: Settlement[] = [];
  const debtors = Object.entries(balances)
    .filter(([, v]) => v < -0.01)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => a.amount - b.amount);

  const creditors = Object.entries(balances)
    .filter(([, v]) => v > 0.01)
    .map(([id, amount]) => ({ id, amount }))
    .sort((a, b) => b.amount - a.amount);

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debt = Math.abs(debtors[i].amount);
    const credit = creditors[j].amount;
    const amount = Math.min(debt, credit);

    settlements.push({
      fromId: debtors[i].id,
      toId: creditors[j].id,
      amount: Math.round(amount * 100) / 100,
    });

    debtors[i].amount += amount;
    creditors[j].amount -= amount;

    if (Math.abs(debtors[i].amount) < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return settlements;
}

// --- STORAGE KEYS ---
const KEYS = {
  people: 'splitfair_people',
  expenses: 'splitfair_expenses',
  currency: 'splitfair_currency',
  currentUserId: 'splitfair_current_user',
  hasOnboarded: 'splitfair_has_onboarded',
};

// --- CONTEXT ---
type AppContextType = {
  people: Person[];
  expenses: Expense[];
  currency: Currency;
  isLoading: boolean;
  currentUserId: string | null;
  setCurrentUserId: (id: string | null) => void;
  setPeople: React.Dispatch<React.SetStateAction<Person[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setCurrency: (currency: Currency) => void;
  addPerson: (name: string) => void;
  removePerson: (id: string) => void;
  addExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;
  hasOnboarded: boolean;
  setHasOnboarded: (value: boolean) => void;
  updateExpense: (expense: Expense) => void;
};

const AppContext = createContext<AppContextType | null>(null);

const PERSON_COLORS = [
  '#FF6B9D', '#4ECDC4', '#FF6B6B', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currency, setCurrencyState] = useState<Currency>('ZAR');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null);
  const [hasOnboarded, setHasOnboardedState] = useState(false);
  
  // Load data on startup
  useEffect(() => {
    const load = async () => {
      try {
        const [storedPeople, storedExpenses, storedCurrency, storedCurrentUser, storedHasOnboarded] = await Promise.all([
          AsyncStorage.getItem(KEYS.people),
          AsyncStorage.getItem(KEYS.expenses),
          AsyncStorage.getItem(KEYS.currency),
          AsyncStorage.getItem(KEYS.currentUserId),
          AsyncStorage.getItem(KEYS.hasOnboarded),
        ]);
        if (storedPeople) setPeople(JSON.parse(storedPeople));
        if (storedExpenses) setExpenses(JSON.parse(storedExpenses));
        if (storedCurrency) setCurrencyState(storedCurrency as Currency);
        if (storedCurrentUser) setCurrentUserIdState(storedCurrentUser);
        if (storedHasOnboarded) setHasOnboardedState(storedHasOnboarded === 'true');
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Save people whenever they change
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(KEYS.people, JSON.stringify(people));
  }, [people, isLoading]);
  
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(KEYS.expenses, JSON.stringify(expenses));
  }, [expenses, isLoading]);
  
  const setHasOnboarded = async (value: boolean) => {
    setHasOnboardedState(value);
    await AsyncStorage.setItem(KEYS.hasOnboarded, value.toString());
  };

  const addPerson = (name: string) => {
    const id = Date.now().toString();
    const color = PERSON_COLORS[people.length % PERSON_COLORS.length];
    setPeople(prev => [...prev, { id, name, color }]);
  };

  const removePerson = (id: string) => {
    setPeople(prev => prev.filter(p => p.id !== id));
  };

  const addExpense = (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
  };

  const removeExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const updateExpense = (expense: Expense) => {
  setExpenses(prev => prev.map(e => e.id === expense.id ? expense : e));
};

  const setCurrency = async (c: Currency) => {
    setCurrencyState(c);
    await AsyncStorage.setItem(KEYS.currency, c);
  };

  const setCurrentUserId = async (id: string | null) => {
  setCurrentUserIdState(id);
  if (id) await AsyncStorage.setItem(KEYS.currentUserId, id);
  else await AsyncStorage.removeItem(KEYS.currentUserId);
  };

  return (
    <AppContext.Provider value={{
      people, expenses, currency, isLoading,
      setPeople, setExpenses, setCurrency,
      addPerson, removePerson, addExpense, removeExpense, updateExpense,
      currentUserId, setCurrentUserId, hasOnboarded, setHasOnboarded,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}