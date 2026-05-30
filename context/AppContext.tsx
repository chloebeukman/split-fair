import React, { createContext, useContext, useState } from 'react';

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
  splitBetween: string[]; // person IDs
};

export type Expense = {
  id: string;
  title: string;
  items: ExpenseItem[];
  tipPercent: number;
  paidById: string; // person ID
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

    // Payer is credited the full total
    balances[expense.paidById] += total;

    // Each item is debited to the people it's split between
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

// --- CONTEXT ---
type AppContextType = {
  people: Person[];
  expenses: Expense[];
  currency: Currency;
  setPeople: React.Dispatch<React.SetStateAction<Person[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setCurrency: React.Dispatch<React.SetStateAction<Currency>>;
  addPerson: (name: string) => void;
  removePerson: (id: string) => void;
  addExpense: (expense: Expense) => void;
  removeExpense: (id: string) => void;
};

const AppContext = createContext<AppContextType | null>(null);

const PERSON_COLORS = [
  '#FF6B9D', '#4ECDC4', '#FF6B6B', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8',
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [currency, setCurrency] = useState<Currency>('ZAR');

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

  return (
    <AppContext.Provider value={{
      people, expenses, currency,
      setPeople, setExpenses, setCurrency,
      addPerson, removePerson, addExpense, removeExpense,
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