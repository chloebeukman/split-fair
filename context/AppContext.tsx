import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  createExpense,
  createPerson,
  createGroup as dbCreateGroup,
  deleteExpense,
  deleteGroup,
  deletePerson,
  fetchGroups,
  updateCurrentPerson,
  updateExpenseInDb,
  updateGroupCurrency,
  updateGroupName,
} from '../lib/database';
import { supabase } from '../lib/supabase';

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
  activeGroupId: 'splitfair_active_group',
  hasOnboarded: 'splitfair_has_onboarded',
};

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
  addGroup: (name: string) => Promise<void>;
  removeGroup: (id: string) => Promise<void>;
  renameGroup: (id: string, name: string) => Promise<void>;
  setActiveGroupId: (id: string) => void;
  setIsGuest: (value: boolean) => Promise<void>;

  // People actions
  addPerson: (name: string) => Promise<void>;
  removePerson: (id: string) => Promise<void>;

  // Expense actions
  addExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  removeExpense: (id: string) => Promise<void>;
  updateExpense: (expense: Expense) => Promise<void>;

  // Settings actions
  setCurrency: (currency: Currency) => Promise<void>;
  setCurrentUserId: (id: string | null) => Promise<void>;

  // App actions
  setHasOnboarded: (value: boolean) => Promise<void>;
  resetActiveGroup: () => Promise<void>;
};

const AppContext = createContext<AppContextType | null>(null);

// --- PROVIDER ---
export function AppProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroupId, setActiveGroupIdState] = useState<string | null>(null);
  const [hasOnboarded, setHasOnboardedState] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuest, setIsGuestState] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const activeGroup = groups.find(g => g.id === activeGroupId) ?? null;

  // Load on startup
  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: { session } }, storedActiveGroupId, storedHasOnboarded, storedGuestMode] = await Promise.all([
          supabase.auth.getSession(),
          AsyncStorage.getItem(KEYS.activeGroupId),
          AsyncStorage.getItem(KEYS.hasOnboarded),
          AsyncStorage.getItem('splitfair_guest_mode'),
        ]);

        if (storedHasOnboarded) setHasOnboardedState(storedHasOnboarded === 'true');
        if (storedGuestMode) setIsGuestState(storedGuestMode === 'true');

        if (session?.user) {
          setUserId(session.user.id);
          const fetchedGroups = await fetchGroups(session.user.id);
          setGroups(fetchedGroups);

          if (storedActiveGroupId && fetchedGroups.find(g => g.id === storedActiveGroupId)) {
            setActiveGroupIdState(storedActiveGroupId);
          } else if (fetchedGroups.length > 0) {
            setActiveGroupIdState(fetchedGroups[0].id);
          }
        } else if (storedGuestMode === 'true') {
          // Guest mode — load from AsyncStorage
          const storedGroups = await AsyncStorage.getItem('splitfair_groups');
          if (storedGroups) {
            const parsed = JSON.parse(storedGroups);
            setGroups(parsed);
            if (storedActiveGroupId && parsed.find((g: Group) => g.id === storedActiveGroupId)) {
              setActiveGroupIdState(storedActiveGroupId);
            } else if (parsed.length > 0) {
              setActiveGroupIdState(parsed[0].id);
            }
          }
        }
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    load();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        const fetchedGroups = await fetchGroups(session.user.id);
        setGroups(fetchedGroups);
        if (fetchedGroups.length > 0) {
          setActiveGroupIdState(fetchedGroups[0].id);
        }
      } else {
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Save guest groups to AsyncStorage
  useEffect(() => {
    if (isLoading || !isGuest) return;
    AsyncStorage.setItem('splitfair_groups', JSON.stringify(groups));
  }, [groups, isLoading, isGuest]);

  // Save active group id
  useEffect(() => {
    if (isLoading || !activeGroupId) return;
    AsyncStorage.setItem(KEYS.activeGroupId, activeGroupId);
  }, [activeGroupId, isLoading]);

  const updateLocalGroup = (id: string, updater: (group: Group) => Group) => {
    setGroups(prev => prev.map(g => g.id === id ? updater(g) : g));
  };

  // --- GROUP ACTIONS ---
  const addGroup = async (name: string) => {
    if (userId) {
      const group = await dbCreateGroup(name, userId);
      if (group) {
        setGroups(prev => [...prev, group]);
        setActiveGroupIdState(group.id);
        AsyncStorage.setItem(KEYS.activeGroupId, group.id);
      }
    } else {
      // Guest mode
      const group: Group = {
        id: Date.now().toString(),
        name,
        people: [],
        expenses: [],
        currency: 'ZAR',
        currentUserId: null,
      };
      setGroups(prev => [...prev, group]);
      setActiveGroupIdState(group.id);
      AsyncStorage.setItem(KEYS.activeGroupId, group.id);
    }
  };

  const removeGroup = async (id: string) => {
    if (userId) await deleteGroup(id);
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

  const renameGroup = async (id: string, name: string) => {
    if (userId) await updateGroupName(id, name);
    updateLocalGroup(id, g => ({ ...g, name }));
  };

  const setActiveGroupId = (id: string) => {
    setActiveGroupIdState(id);
    AsyncStorage.setItem(KEYS.activeGroupId, id);
  };

  // --- PEOPLE ACTIONS ---
  const addPerson = async (name: string) => {
    if (!activeGroupId) return;
    const color = PERSON_COLORS[(activeGroup?.people.length ?? 0) % PERSON_COLORS.length];

    if (userId) {
      const person = await createPerson(activeGroupId, name, color);
      if (person) {
        updateLocalGroup(activeGroupId, g => ({ ...g, people: [...g.people, person] }));
      }
    } else {
      const person: Person = { id: Date.now().toString(), name, color };
      updateLocalGroup(activeGroupId, g => ({ ...g, people: [...g.people, person] }));
    }
  };

  const removePerson = async (id: string) => {
    if (!activeGroupId) return;
    if (userId) await deletePerson(id);
    updateLocalGroup(activeGroupId, g => ({ ...g, people: g.people.filter(p => p.id !== id) }));
  };

  // --- EXPENSE ACTIONS ---
  const addExpense = async (expense: Omit<Expense, 'id'>) => {
    if (!activeGroupId) return;

    if (userId) {
      const created = await createExpense(activeGroupId, expense);
      if (created) {
        updateLocalGroup(activeGroupId, g => ({ ...g, expenses: [...g.expenses, created] }));
      }
    } else {
      const newExpense: Expense = { ...expense, id: Date.now().toString() };
      updateLocalGroup(activeGroupId, g => ({ ...g, expenses: [...g.expenses, newExpense] }));
    }
  };

  const removeExpense = async (id: string) => {
    if (!activeGroupId) return;
    if (userId) await deleteExpense(id);
    updateLocalGroup(activeGroupId, g => ({ ...g, expenses: g.expenses.filter(e => e.id !== id) }));
  };

  const updateExpense = async (expense: Expense) => {
    if (!activeGroupId) return;
    if (userId) await updateExpenseInDb(activeGroupId, expense);
    updateLocalGroup(activeGroupId, g => ({
      ...g,
      expenses: g.expenses.map(e => e.id === expense.id ? expense : e),
    }));
  };

  // --- SETTINGS ACTIONS ---
  const setCurrency = async (currency: Currency) => {
    if (!activeGroupId) return;
    if (userId) await updateGroupCurrency(activeGroupId, currency);
    updateLocalGroup(activeGroupId, g => ({ ...g, currency }));
  };

  const setCurrentUserId = async (id: string | null) => {
    if (!activeGroupId) return;
    if (userId) await updateCurrentPerson(activeGroupId, userId, id);
    updateLocalGroup(activeGroupId, g => ({ ...g, currentUserId: id }));
  };

  const resetActiveGroup = async () => {
    if (!activeGroupId) return;
    const group = activeGroup;
    if (!group) return;

    if (userId) {
      await Promise.all(group.expenses.map(e => deleteExpense(e.id)));
      await Promise.all(group.people.map(p => deletePerson(p.id)));
    }

    updateLocalGroup(activeGroupId, g => ({
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
      groups, activeGroupId, activeGroup, hasOnboarded, isLoading, isGuest,
      addGroup, removeGroup, renameGroup, setActiveGroupId, setIsGuest,
      addPerson, removePerson,
      addExpense, removeExpense, updateExpense,
      setCurrency, setCurrentUserId,
      setHasOnboarded, resetActiveGroup,
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