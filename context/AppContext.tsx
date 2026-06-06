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

export type Group = {
  id: string;
  name: string;
  people: Person[];
  expenses: Expense[];
  currency: Currency;
  currentUserId: string | null;
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
    const tipMultiplier = 1 + expense.tipPercent / 100;
    const total = subtotal * tipMultiplier;

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
  groups: 'splitfair_groups',
  activeGroupId: 'splitfair_active_group',
  hasOnboarded: 'splitfair_has_onboarded',
};

// --- DEFAULT GROUP ---
function createGroup(name: string): Group {
  return {
    id: Date.now().toString(),
    name,
    people: [],
    expenses: [],
    currency: 'ZAR',
    currentUserId: null,
  };
}

const PERSON_COLORS = [
  '#FF6B9D', '#4ECDC4', '#FF6B6B', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
];

// --- CONTEXT TYPE ---
type AppContextType = {
  groups: Group[];
  activeGroupId: string | null;
  activeGroup: Group | null;
  hasOnboarded: boolean;
  isLoading: boolean;
  isGuest: boolean;

  // Group actions
  addGroup: (name: string) => void;
  removeGroup: (id: string) => void;
  renameGroup: (id: string, name: string) => void;
  setActiveGroupId: (id: string) => void;
  setIsGuest: (value: boolean) => void;


  // People actions (scoped to active group)
  addPerson: (name: string) => void;
  removePerson: (id: string) => void;

  // Expense actions (scoped to active group)
  addExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;
  updateExpense: (expense: Expense) => void;

  // Settings actions (scoped to active group)
  setCurrency: (currency: Currency) => void;
  setCurrentUserId: (id: string | null) => void;

  // App actions
  setHasOnboarded: (value: boolean) => void;
  resetActiveGroup: () => void;
};

const AppContext = createContext<AppContextType | null>(null);

// --- PROVIDER ---
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
  const [hasOnboarded, setHasOnboardedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuestState] = useState(false);

  // Derived active group
  const activeGroup = groups.find(g => g.id === activeGroupId) ?? null;

  // Load on startup
  useEffect(() => {
    const load = async () => {
      try {
        const [storedGroups, storedActiveGroupId, storedHasOnboarded, storedGuestMode] = await Promise.all([
          AsyncStorage.getItem(KEYS.groups),
          AsyncStorage.getItem(KEYS.activeGroupId),
          AsyncStorage.getItem(KEYS.hasOnboarded),
          AsyncStorage.getItem('splitfair_guest_mode'),
        ]);

        if (storedGroups) {
          const parsed = JSON.parse(storedGroups);
          setGroups(parsed);
          if (storedActiveGroupId) {
            setActiveGroupIdState(storedActiveGroupId);
          } else if (parsed.length > 0) {
            setActiveGroupIdState(parsed[0].id);
          }
        }
        if (storedHasOnboarded) setHasOnboardedState(storedHasOnboarded === 'true');
        if (storedGuestMode) setIsGuestState(storedGuestMode === 'true');
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Save groups whenever they change
  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(KEYS.groups, JSON.stringify(groups));
  }, [groups, isLoading]);

  // Save active group id whenever it changes
  useEffect(() => {
    if (isLoading || !activeGroupId) return;
    AsyncStorage.setItem(KEYS.activeGroupId, activeGroupId);
  }, [activeGroupId, isLoading]);

  // Helper to update active group
  const updateActiveGroup = (updater: (group: Group) => Group) => {
    setGroups(prev => prev.map(g => g.id === activeGroupId ? updater(g) : g));
  };

  // --- GROUP ACTIONS ---
  const addGroup = (name: string) => {
    const group = createGroup(name);
    setGroups(prev => [...prev, group]);
    setActiveGroupIdState(group.id);
    AsyncStorage.setItem(KEYS.activeGroupId, group.id);
  };

  const removeGroup = (id: string) => {
    setGroups(prev => {
      const remaining = prev.filter(g => g.id !== id);
      if (activeGroupId === id) {
        const newActive = remaining[0]?.id ?? null;
        setActiveGroupIdState(newActive);
        if (newActive) AsyncStorage.setItem(KEYS.activeGroupId, newActive);
      }
      return remaining;
    });
  };

  const renameGroup = (id: string, name: string) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name } : g));
  };

  const setActiveGroupId = (id: string) => {
    setActiveGroupIdState(id);
    AsyncStorage.setItem(KEYS.activeGroupId, id);
  };

  // --- PEOPLE ACTIONS ---
  const addPerson = (name: string) => {
    updateActiveGroup(g => ({
      ...g,
      people: [...g.people, {
        id: Date.now().toString(),
        name,
        color: PERSON_COLORS[g.people.length % PERSON_COLORS.length],
      }],
    }));
  };

  const removePerson = (id: string) => {
    updateActiveGroup(g => ({ ...g, people: g.people.filter(p => p.id !== id) }));
  };

  // --- EXPENSE ACTIONS ---
  const addExpense = (expense: Expense) => {
    updateActiveGroup(g => ({ ...g, expenses: [...g.expenses, expense] }));
  };

  const removeExpense = (id: string) => {
    updateActiveGroup(g => ({ ...g, expenses: g.expenses.filter(e => e.id !== id) }));
  };

  const updateExpense = (expense: Expense) => {
    updateActiveGroup(g => ({
      ...g,
      expenses: g.expenses.map(e => e.id === expense.id ? expense : e),
    }));
  };

  // --- SETTINGS ACTIONS ---
  const setCurrency = (currency: Currency) => {
    updateActiveGroup(g => ({ ...g, currency }));
  };

  const setCurrentUserId = (id: string | null) => {
    updateActiveGroup(g => ({ ...g, currentUserId: id }));
  };

  const resetActiveGroup = () => {
    updateActiveGroup(g => ({
      ...g,
      people: [],
      expenses: [],
      currency: 'ZAR',
      currentUserId: null,
    }));
  };

  // --- APP ACTIONS ---
  const setHasOnboarded = async (value: boolean) => {
    setHasOnboardedState(value);
    await AsyncStorage.setItem(KEYS.hasOnboarded, value.toString());
  };

  const setIsGuest = async (value: boolean) => {
    setIsGuestState(value);
    if (value) {
      await AsyncStorage.setItem('splitfair_guest_mode', 'true');
    } else {
      await AsyncStorage.removeItem('splitfair_guest_mode');
    }
  };

  return (
    <AppContext.Provider value={{
      groups, activeGroupId, activeGroup, hasOnboarded, isLoading,
      addGroup, removeGroup, renameGroup, setActiveGroupId,
      addPerson, removePerson,
      addExpense, removeExpense, updateExpense,
      setCurrency, setCurrentUserId,
      setHasOnboarded, resetActiveGroup,
      isGuest, setIsGuest,
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