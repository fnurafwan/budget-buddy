import { useState, useCallback, useMemo } from 'react';
import type { Budget, Expense } from '@/types/budget';

const MOCK_BUDGETS: Budget[] = [
  { id: '1', title: 'Groceries', allocatedAmount: 500, category: 'food', icon: 'UtensilsCrossed', createdAt: '2024-01-01' },
  { id: '2', title: 'Holiday Trip', allocatedAmount: 2000, category: 'travel', icon: 'Plane', createdAt: '2024-01-05' },
  { id: '3', title: 'Emergency Fund', allocatedAmount: 1000, category: 'savings', icon: 'PiggyBank', createdAt: '2024-01-10' },
  { id: '4', title: 'Netflix & Games', allocatedAmount: 150, category: 'entertainment', icon: 'Gamepad2', createdAt: '2024-01-12' },
  { id: '5', title: 'Electricity & Water', allocatedAmount: 300, category: 'utilities', icon: 'Zap', createdAt: '2024-01-15' },
  { id: '6', title: 'Online Courses', allocatedAmount: 400, category: 'education', icon: 'GraduationCap', createdAt: '2024-02-01' },
];

const MOCK_EXPENSES: Expense[] = [
  { id: 'e1', budgetId: '1', amount: 85.50, description: 'Weekly grocery run', date: '2024-02-01', type: 'realization', createdAt: '2024-02-01' },
  { id: 'e2', budgetId: '1', amount: 42.30, description: 'Fresh produce', date: '2024-02-05', type: 'allocation', createdAt: '2024-02-05' },
  { id: 'e3', budgetId: '2', amount: 450, description: 'Flight tickets deposit', date: '2024-02-03', type: 'allocation', createdAt: '2024-02-03' },
  { id: 'e4', budgetId: '4', amount: 15.99, description: 'Netflix subscription', date: '2024-02-01', type: 'realization', createdAt: '2024-02-01' },
  { id: 'e5', budgetId: '5', amount: 120, description: 'Electricity bill', date: '2024-02-10', type: 'realization', createdAt: '2024-02-10' },
  { id: 'e6', budgetId: '3', amount: 200, description: 'Monthly savings', date: '2024-02-15', type: 'allocation', createdAt: '2024-02-15' },
  { id: 'e7', budgetId: '6', amount: 49.99, description: 'Udemy course', date: '2024-02-08', type: 'realization', createdAt: '2024-02-08' },
  { id: 'e8', budgetId: '1', amount: 65, description: 'Dinner ingredients', date: '2024-02-12', type: 'realization', createdAt: '2024-02-12' },
];

export function useBudgetData() {
  const [budgets, setBudgets] = useState<Budget[]>(MOCK_BUDGETS);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);

  const addBudget = useCallback((budget: Omit<Budget, 'id' | 'createdAt'>) => {
    setBudgets(prev => [...prev, { ...budget, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
  }, []);

  const addExpense = useCallback((expense: Omit<Expense, 'id' | 'createdAt'>) => {
    setExpenses(prev => [...prev, { ...expense, id: crypto.randomUUID(), createdAt: new Date().toISOString() }]);
  }, []);

  const deleteExpense = useCallback((id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  }, []);

  const updateExpense = useCallback((id: string, data: Partial<Omit<Expense, 'id' | 'createdAt'>>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }, []);

  const deleteBudget = useCallback((id: string) => {
    setBudgets(prev => prev.filter(b => b.id !== id));
    setExpenses(prev => prev.filter(e => e.budgetId !== id));
  }, []);

  const getSpentForBudget = useCallback((budgetId: string) => {
    return expenses.filter(e => e.budgetId === budgetId).reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getAllocationForBudget = useCallback((budgetId: string) => {
    return expenses.filter(e => e.budgetId === budgetId && e.type === 'allocation').reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const getRealizationForBudget = useCallback((budgetId: string) => {
    return expenses.filter(e => e.budgetId === budgetId && e.type === 'realization').reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const summary = useMemo(() => {
    const totalBudgeted = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    return { totalBudgeted, totalSpent, remaining: totalBudgeted - totalSpent };
  }, [budgets, expenses]);

  return { budgets, expenses, addBudget, addExpense, deleteExpense, updateExpense, deleteBudget, getSpentForBudget, getAllocationForBudget, getRealizationForBudget, summary };
}
