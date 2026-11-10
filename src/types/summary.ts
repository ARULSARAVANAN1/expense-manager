export interface MonthlySummaryTotals {
  income: number;
  expense: number;
  netSavings: number;
  savingsRate: number;
  incomeCount: number;
  expenseCount: number;
}

interface SummaryCategory {
  categoryName: string;
  amount: number;
  transactionCount: number;
}

export interface MonthlySummaryInsight {
  type: string;
  title: string;
  message: string;
}

export interface MonthlySummary {
  month: string;
  timezone: string;
  currency: string;
  totals: MonthlySummaryTotals;
  topIncomeCategories: SummaryCategory[];
  topExpenseCategories: SummaryCategory[];
  comparison: {
    previousMonth: string;
    hasPreviousRecords: boolean;
    basis: string;
    isCurrentMonth: boolean;
    previousTotals: MonthlySummaryTotals | null;
    expenseChangePercent: number | null;
    netSavingsChange: number | null;
    expenseCategories: {
      categoryName: string;
      amount: number;
      previousAmount: number | null;
      changePercent: number | null;
    }[];
  };
  summary: string;
  highlights: string[];
  savingSuggestions: string[];
  card: {
    greeting: string;
    introduction: string;
    insights: MonthlySummaryInsight[];
  };
  source: string;
}
