export type GoalCategory =
  | "Emergency Fund"
  | "Travel"
  | "Gadgets"
  | "Vehicle"
  | "Education"
  | "Home"
  | "Wedding"
  | "Debt Repayment"
  | "Other";

export type GoalPriority = "High" | "Medium" | "Low";
export type GoalStatus = "On Track" | "At Risk" | "Behind" | "Completed" | "Paused";

export interface GoalContribution {
  id: string;
  date: string;
  amount: number;
  description: string;
}

export interface FinancialGoal {
  id: string;
  name: string;
  category: GoalCategory;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  priority: GoalPriority;
  monthlyContribution: number;
  status: GoalStatus;
  createdAt: string;
  contributions: GoalContribution[];
}

export type GoalInput = Omit<FinancialGoal, "id" | "status" | "createdAt" | "contributions">;
