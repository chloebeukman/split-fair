import { Currency, Expense, ExpenseItem, Group, Person } from '../context/AppContext';
import { supabase } from './supabase';

// --- GROUPS ---
export async function fetchGroups(userId: string): Promise<Group[]> {
  const { data: groups, error } = await supabase
    .from('groups')
    .select('*')
    .eq('owner_id', userId)
    .order('created_at', { ascending: true });

  if (error || !groups) return [];

  const fullGroups: Group[] = await Promise.all(groups.map(async (group) => {
    const [peopleResult, expensesResult, memberResult] = await Promise.all([
      supabase.from('people').select('*').eq('group_id', group.id).order('created_at', { ascending: true }),
      supabase.from('expenses').select('*').eq('group_id', group.id).order('date', { ascending: true }),
      supabase.from('group_members').select('*').eq('group_id', group.id).eq('user_id', userId).single(),
    ]);

    const people: Person[] = (peopleResult.data ?? []).map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
    }));

    const expenses: Expense[] = await Promise.all((expensesResult.data ?? []).map(async (expense) => {
      const { data: items } = await supabase
        .from('expense_items')
        .select('*')
        .eq('expense_id', expense.id);

      const expenseItems: ExpenseItem[] = (items ?? []).map(item => ({
        id: item.id,
        name: item.name,
        amount: item.amount,
        splitBetween: item.split_between ?? [],
      }));

      return {
        id: expense.id,
        title: expense.title,
        items: expenseItems,
        tipPercent: expense.tip_percent,
        paidById: expense.paid_by_id,
        date: expense.date,
      };
    }));

    return {
      id: group.id,
      name: group.name,
      people,
      expenses,
      currency: group.currency as Currency,
      currentUserId: memberResult.data?.current_person_id ?? null,
    };
  }));

  return fullGroups;
}

export async function createGroup(name: string, userId: string): Promise<Group | null> {
  const { data, error } = await supabase
    .from('groups')
    .insert({ name, owner_id: userId, currency: 'ZAR' })
    .select()
    .single();

  if (error || !data) return null;

  await supabase.from('group_members').insert({
    group_id: data.id,
    user_id: userId,
    current_person_id: null,
  });

  return {
    id: data.id,
    name: data.name,
    people: [],
    expenses: [],
    currency: 'ZAR',
    currentUserId: null,
  };
}

export async function deleteGroup(groupId: string): Promise<boolean> {
  const { error } = await supabase.from('groups').delete().eq('id', groupId);
  return !error;
}

export async function updateGroupName(groupId: string, name: string): Promise<boolean> {
  const { error } = await supabase.from('groups').update({ name }).eq('id', groupId);
  return !error;
}

export async function updateGroupCurrency(groupId: string, currency: Currency): Promise<boolean> {
  const { error } = await supabase.from('groups').update({ currency }).eq('id', groupId);
  return !error;
}

// --- PEOPLE ---
export async function createPerson(groupId: string, name: string, color: string): Promise<Person | null> {
  const { data, error } = await supabase
    .from('people')
    .insert({ group_id: groupId, name, color })
    .select()
    .single();

  if (error || !data) return null;

  return { id: data.id, name: data.name, color: data.color };
}

export async function deletePerson(personId: string): Promise<boolean> {
  const { error } = await supabase.from('people').delete().eq('id', personId);
  return !error;
}

// --- EXPENSES ---
export async function createExpense(groupId: string, expense: Omit<Expense, 'id'>): Promise<Expense | null> {
  const { data, error } = await supabase
    .from('expenses')
    .insert({
      group_id: groupId,
      title: expense.title,
      tip_percent: expense.tipPercent,
      paid_by_id: expense.paidById,
      date: expense.date,
    })
    .select()
    .single();

  if (error || !data) return null;

  const items = await Promise.all(expense.items.map(item =>
    supabase.from('expense_items').insert({
      expense_id: data.id,
      name: item.name,
      amount: item.amount,
      split_between: item.splitBetween,
    }).select().single()
  ));

  const expenseItems: ExpenseItem[] = items
    .filter(r => r.data)
    .map(r => ({
      id: r.data!.id,
      name: r.data!.name,
      amount: r.data!.amount,
      splitBetween: r.data!.split_between ?? [],
    }));

  return {
    id: data.id,
    title: data.title,
    items: expenseItems,
    tipPercent: data.tip_percent,
    paidById: data.paid_by_id,
    date: data.date,
  };
}

export async function deleteExpense(expenseId: string): Promise<boolean> {
  const { error } = await supabase.from('expenses').delete().eq('id', expenseId);
  return !error;
}

export async function updateExpenseInDb(groupId: string, expense: Expense): Promise<boolean> {
  const { error: expenseError } = await supabase
    .from('expenses')
    .update({
      title: expense.title,
      tip_percent: expense.tipPercent,
      paid_by_id: expense.paidById,
    })
    .eq('id', expense.id);

  if (expenseError) return false;

  await supabase.from('expense_items').delete().eq('expense_id', expense.id);

  await Promise.all(expense.items.map(item =>
    supabase.from('expense_items').insert({
      expense_id: expense.id,
      name: item.name,
      amount: item.amount,
      split_between: item.splitBetween,
    })
  ));

  return true;
}

// --- GROUP MEMBERS ---
export async function updateCurrentPerson(groupId: string, userId: string, personId: string | null): Promise<boolean> {
  const { error } = await supabase
    .from('group_members')
    .upsert({
      group_id: groupId,
      user_id: userId,
      current_person_id: personId,
    });
  return !error;
}