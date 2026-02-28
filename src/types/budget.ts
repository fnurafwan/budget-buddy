export type Category = 'food' | 'travel' | 'savings' | 'entertainment' | 'utilities' | 'shopping' | 'health' | 'education';

export interface Budget {
  id: string;
  title: string;
  allocatedAmount: number;
  category: Category;
  icon: string;
  createdAt: string;
}

export type ExpenseType = 'allocation' | 'realization';

export interface Expense {
  id: string;
  budgetId: string;
  amount: number;
  description: string;
  date: string;
  type: ExpenseType;
  createdAt: string;
}

export const CATEGORIES: { value: Category; label: string; icon: string; color: string }[] = [
  { value: 'food', label: 'Food & Dining', icon: 'UtensilsCrossed', color: 'text-warning' },
  { value: 'travel', label: 'Travel', icon: 'Plane', color: 'text-primary' },
  { value: 'savings', label: 'Savings', icon: 'PiggyBank', color: 'text-income' },
  { value: 'entertainment', label: 'Entertainment', icon: 'Gamepad2', color: 'text-expense' },
  { value: 'utilities', label: 'Utilities', icon: 'Zap', color: 'text-warning' },
  { value: 'shopping', label: 'Shopping', icon: 'ShoppingBag', color: 'text-primary' },
  { value: 'health', label: 'Health', icon: 'Heart', color: 'text-expense' },
  { value: 'education', label: 'Education', icon: 'GraduationCap', color: 'text-income' },
];
