export interface Expense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  accountId?: string | null;
  accountName?: string | null;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface FinanceCategory extends ExpenseCategory {
  type: "expense" | "income";
}

export interface ExpenseAccount {
  id: string;
  name: string;
  type?: string;
}

export type ExpenseInput = Omit<Expense, "id" | "createdAt" | "updatedAt">;

export type Income = Expense;
export type IncomeInput = ExpenseInput;

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  month: string;
  spent?: number;
  remaining?: number;
  percent?: number;
}

export const incomeCategories: ExpenseCategory[] = [
  { id: "salary", name: "Salary", icon: "💼", color: "var(--category-salary)" },
  { id: "freelance", name: "Freelance", icon: "✦", color: "var(--category-freelance)" },
  { id: "investment", name: "Investments", icon: "↗", color: "var(--category-investment)" },
  { id: "gift-income", name: "Gifts", icon: "◇", color: "var(--category-gift-income)" },
  { id: "other-income", name: "Other income", icon: "＋", color: "var(--category-other-income)" },
];

export const expenseCategories: ExpenseCategory[] = [
  { id: "food", name: "Food & Dining", icon: "🍽", color: "var(--category-food)" },
  { id: "groceries", name: "Groceries", icon: "🛒", color: "var(--category-groceries)" },
  { id: "transport", name: "Transportation", icon: "🚇", color: "var(--category-transport)" },
  { id: "shopping", name: "Shopping", icon: "🛍", color: "var(--category-shopping)" },
  { id: "bills", name: "Bills & Utilities", icon: "⚡", color: "var(--category-bills)" },
  { id: "health", name: "Healthcare", icon: "✚", color: "var(--category-health)" },
  { id: "entertainment", name: "Entertainment", icon: "🎬", color: "var(--category-entertainment)" },
  { id: "travel", name: "Travel", icon: "✈", color: "var(--category-travel)" },
  { id: "education", name: "Education", icon: "📚", color: "var(--category-education)" },
  { id: "other", name: "Others", icon: "◉", color: "var(--category-other)" },
];

export const expenseAccounts: ExpenseAccount[] = [
  { id: "hdfc", name: "HDFC Bank" },
  { id: "sbi", name: "SBI" },
  { id: "cash", name: "Cash" },
  { id: "upi", name: "UPI" },
  { id: "credit", name: "Credit Card" },
];
