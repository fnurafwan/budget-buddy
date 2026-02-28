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

export function useBudgetData() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [persons, setPersons] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Listen to Budgets Real-time
  useEffect(() => {
    const q = query(collection(db, 'budgets'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
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
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Expense[];
      setExpenses(data);
    });
    return () => unsubscribe();
  }, []);

  // 3. Listen to Persons Real-time (sort client-side to avoid Firestore index requirement)
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'persons'), (snapshot) => {
      const data = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Person))
        .sort((a, b) => a.name.localeCompare(b.name, 'id'));
      setPersons(data);
    });
    return () => unsubscribe();
  }, []);

  // 4. Firebase Actions
  const addBudget = useCallback(async (budget: Omit<Budget, 'id' | 'createdAt'>) => {
    await addDoc(collection(db, 'budgets'), {
      ...budget,
      createdAt: new Date().toISOString(),
    });
  }, []);

  const resolvePersonId = useCallback(async (name: string): Promise<string> => {
    const trimmed = name.trim();
    // Cek dari state lokal dulu (onSnapshot selalu up-to-date)
    const existing = persons.find(p => p.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;

    // Belum ada — buat baru
    const ref = await addDoc(collection(db, 'persons'), {
      name: trimmed,
      createdAt: new Date().toISOString(),
    });
    return ref.id;
  }, [persons]);

  const addExpense = useCallback(async (
    expense: Omit<Expense, 'id' | 'createdAt'> & { personName?: string }
  ) => {
    const { personName, ...rest } = expense;
    let personId: string | undefined;
    let personNameResolved: string | undefined;

    if (personName && personName.trim()) {
      personId = await resolvePersonId(personName.trim());
      personNameResolved = personName.trim();
    }

    await addDoc(collection(db, 'expenses'), {
      ...rest,
      ...(personId ? { personId, personName: personNameResolved } : {}),
      createdAt: new Date().toISOString(),
    });
  }, [resolvePersonId]);

  const deleteExpense = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'expenses', id));
  }, []);

  const updateExpense = useCallback(async (id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
    await updateDoc(doc(db, 'expenses', id), data);
  }, []);

  const deleteBudget = useCallback(async (id: string) => {
    await deleteDoc(doc(db, 'budgets', id));
    // Opsional: Hapus juga semua expenses yang terkait budget ini
  }, []);

  // 5. Calculation Functions (Dibutuhkan oleh Index.tsx)
  
  // Total Spent (Gabungan Allocation & Realization)
  const getSpentForBudget = useCallback((budgetId: string) => {
    return expenses
      .filter(e => e.budgetId === budgetId)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Total Allocation
  const getAllocationForBudget = useCallback((budgetId: string) => {
    return expenses
      .filter(e => e.budgetId === budgetId && e.type === 'allocation')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Total Realization
  const getRealizationForBudget = useCallback((budgetId: string) => {
    return expenses
      .filter(e => e.budgetId === budgetId && e.type === 'realization')
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  // Summary Overview
  const summary = useMemo(() => {
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    return { 
      totalBudgeted, 
      totalSpent, 
      remaining: totalBudgeted - totalSpent 
    };
  }, [budgets, expenses]);

  return { 
    budgets, 
    expenses, 
    persons,
    loading, 
    addBudget, 
    addExpense, 
    deleteExpense, 
    updateExpense, 
    deleteBudget, 
    getSpentForBudget, 
    getAllocationForBudget, 
    getRealizationForBudget, 
    summary 
  };
}