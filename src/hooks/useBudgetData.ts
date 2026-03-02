import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import {
  collection,
  onSnapshot,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
} from 'firebase/firestore';
import type { Budget, Expense } from '@/types/budget';

export interface Person {
  id: string;
  name: string;
  createdAt: string;
}

export interface CategoryExpense {
  id: string;
  name: string;
  createdAt: string;
}

export function useBudgetData() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [categoryExpenses, setCategoryExpenses] = useState<CategoryExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Listen to Budgets Real-time
  useEffect(() => {
    const q = query(collection(db, 'budgets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Budget[];
      setBudgets(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Listen to Expenses Real-time
  useEffect(() => {
    const q = query(collection(db, 'expenses'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
      })) as Expense[];
      setExpenses(data);
    });
    return () => unsubscribe();
  }, []);

  // 3. Listen to Persons Real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'persons'), (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as Person))
        .sort((a, b) => a.name.localeCompare(b.name, 'id'));
      setPersons(data);
    });
    return () => unsubscribe();
  }, []);

  // 4. Listen to CategoryExpenses Real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categoryExpenses'), (snapshot) => {
      const data = snapshot.docs
        .map(d => ({ id: d.id, ...d.data() } as CategoryExpense))
        .sort((a, b) => a.name.localeCompare(b.name, 'id'));
      setCategoryExpenses(data);
    });
    return () => unsubscribe();
  }, []);

  // 5. Budget CRUD
  // Budget sekarang menyimpan userId agar bisa difilter per user
  const addBudget = useCallback(async (
    budget: Omit<Budget, 'id' | 'createdAt'>
  ) => {
    await addDoc(collection(db, 'budgets'), {
      ...budget,
      createdAt: new Date().toISOString(),
    });
  }, []);

  const deleteBudget = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'budgets', id));
  }, []);

  const updateBudget = useCallback(async (
    id: string,
    data: Partial<Omit<Budget, 'id' | 'createdAt'>>
  ) => {
    await updateDoc(doc(db, 'budgets', id), data);
  }, []);

  // 6. Person resolve
  const resolvePersonId = useCallback(async (name: string): Promise<string> => {
    const trimmed = name.trim();
    const existing = persons.find(
      p => p.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing.id;
    const ref = await addDoc(collection(db, 'persons'), {
      name: trimmed,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  }, [persons]);

  // 7. CategoryExpense resolve
  const resolveCategoryExpenseId = useCallback(async (name: string): Promise<string> => {
    const trimmed = name.trim();
    const existing = categoryExpenses.find(
      c => c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing.id;
    const ref = await addDoc(collection(db, 'categoryExpenses'), {
      name: trimmed,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  }, [categoryExpenses]);

  // 8. Expense CRUD
  const addExpense = useCallback(async (
    expense: Omit<Expense, 'id' | 'createdAt'> & {
      personName?: string;
      categoryExpenseName?: string;
    }
  ) => {
    const { personName, categoryExpenseName, ...rest } = expense;

    if (personName?.trim()) {
      const personId = await resolvePersonId(personName.trim());
      await addDoc(collection(db, 'expenses'), {
        ...rest,
        personId,
        personName: personName.trim(),
        createdAt: new Date().toISOString(),
      });
      return;
    }

    if (categoryExpenseName?.trim()) {
      const categoryExpenseId = await resolveCategoryExpenseId(categoryExpenseName.trim());
      await addDoc(collection(db, 'expenses'), {
        ...rest,
        categoryExpenseId,
        categoryExpenseName: categoryExpenseName.trim(),
        createdAt: new Date().toISOString(),
      });
      return;
    }

    await addDoc(collection(db, 'expenses'), {
      ...rest,
      createdAt: new Date().toISOString(),
    });
  }, [resolvePersonId, resolveCategoryExpenseId]);

  const deleteExpense = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'expenses', id));
  }, []);

  const updateExpense = useCallback(async (
    id: string,
    data: Partial<Omit<Expense, 'id' | 'createdAt'>>
  ) => {
    await updateDoc(doc(db, 'expenses', id), data);
  }, []);

  // 9. Calculation helpers
  const getSpentForBudget = useCallback((budgetId: string) => {
    return expenses
      .filter(e => e.budgetId === budgetId)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getAllocationForBudget = useCallback((budgetId: string) => {
    return expenses
      .filter(e => e.budgetId === budgetId && e.type === 'allocation')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getRealizationForBudget = useCallback((budgetId: string) => {
    return expenses
      .filter(e => e.budgetId === budgetId && e.type === 'realization')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Summary dihitung dari SEMUA budget (untuk index overview)
  const summary = useMemo(() => {
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    return {
      totalBudgeted,
      totalSpent,
      remaining: totalBudgeted - totalSpent,
    };
  }, [budgets, expenses]);

  // Summary per-user (untuk SummaryCards yang difilter)
  const getSummaryForUser = useCallback((userId: string | 'all') => {
    const filtered = userId === 'all'
      ? budgets
      : budgets.filter(b => (b as any).userId === userId);
    const filteredIds = new Set(filtered.map(b => b.id));
    const totalBudgeted = filtered.reduce((sum, b) => sum + b.allocatedAmount, 0);
    const totalSpent = expenses
      .filter(e => filteredIds.has(e.budgetId))
      .reduce((sum, e) => sum + e.amount, 0);
    return { totalBudgeted, totalSpent, remaining: totalBudgeted - totalSpent };
  }, [budgets, expenses]);

  return {
    budgets,
    expenses,
    persons,
    categoryExpenses,
    loading,
    addBudget,
    updateBudget,
    deleteBudget,
    addExpense,
    deleteExpense,
    updateExpense,
    getSpentForBudget,
    getAllocationForBudget,
    getRealizationForBudget,
    summary,
    getSummaryForUser,
  };
}