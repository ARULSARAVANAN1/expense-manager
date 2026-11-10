export interface Expense {
  id: string;
  description: string;
  amount: number;
  categoryId: string;
  categoryName: string;
  accountId: string;
  accountName: string;
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
}

export const incomeCategories: ExpenseCategory[] = [
  { id: "salary", name: "Salary", icon: "💼", color: "#16a34a" },
  { id: "freelance", name: "Freelance", icon: "✦", color: "#2563eb" },
  { id: "investment", name: "Investments", icon: "↗", color: "#8b5cf6" },
  { id: "gift-income", name: "Gifts", icon: "◇", color: "#ec4899" },
  { id: "other-income", name: "Other income", icon: "＋", color: "#14b8a6" },
];

export const expenseCategories: ExpenseCategory[] = [
  { id: "food", name: "Food & Dining", icon: "🍽", color: "#f59e0b" },
  { id: "groceries", name: "Groceries", icon: "🛒", color: "#16a34a" },
  { id: "transport", name: "Transportation", icon: "🚇", color: "#2563eb" },
  { id: "shopping", name: "Shopping", icon: "🛍", color: "#8b5cf6" },
  { id: "bills", name: "Bills & Utilities", icon: "⚡", color: "#ef4444" },
  { id: "health", name: "Healthcare", icon: "✚", color: "#ec4899" },
  { id: "entertainment", name: "Entertainment", icon: "🎬", color: "#06b6d4" },
  { id: "travel", name: "Travel", icon: "✈", color: "#14b8a6" },
  { id: "education", name: "Education", icon: "📚", color: "#6366f1" },
  { id: "other", name: "Others", icon: "◉", color: "#64748b" },
];

export const expenseAccounts: ExpenseAccount[] = [
  { id: "hdfc", name: "HDFC Bank" },
  { id: "sbi", name: "SBI" },
  { id: "cash", name: "Cash" },
  { id: "upi", name: "UPI" },
  { id: "credit", name: "Credit Card" },
];
