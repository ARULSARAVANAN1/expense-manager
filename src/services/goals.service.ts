import type { ApiResponse } from "../types/auth";
import type { FinancialGoal, GoalCategory, GoalContribution, GoalInput, GoalPriority, GoalStatus } from "../types/goals";
import api, { unwrapResponse } from "./api";

const categories: Record<string, GoalCategory> = {
  EMERGENCY_FUND: "Emergency Fund", TRAVEL: "Travel", GADGETS: "Gadgets",
  VEHICLE: "Vehicle", EDUCATION: "Education", HOME: "Home", WEDDING: "Wedding",
  DEBT_REPAYMENT: "Debt Repayment", OTHER: "Other",
};
const priorities: Record<string, GoalPriority> = { HIGH: "High", MEDIUM: "Medium", LOW: "Low" };
const progressStatuses: Record<string, GoalStatus> = {
  ON_TRACK: "On Track", AT_RISK: "At Risk", BEHIND: "Behind", COMPLETED: "Completed",
};

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The server returned invalid goals data.");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== "string") throw new Error("The server returned invalid goals data.");
  return value;
}

function amount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error("The server returned an invalid goal amount.");
  }
  return value;
}

function date(value: unknown): string {
  const result = text(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(Date.parse(result))) {
    throw new Error("The server returned an invalid goal date.");
  }
  return result;
}

function toGoal(value: unknown): FinancialGoal {
  const goal = record(value);
  const category = categories[text(goal.category)];
  const priority = priorities[text(goal.priority)];
  const status = goal.status === "PAUSED" ? "Paused"
    : goal.status === "COMPLETED" ? "Completed"
      : goal.status === "ACTIVE" ? progressStatuses[text(goal.progressStatus)] : undefined;
  if (!category || !priority || !status) throw new Error("The server returned an unsupported goal category, priority, or status.");
  return {
    id: text(goal.id), name: text(goal.name), category, priority, status,
    targetAmount: amount(goal.targetAmount), currentAmount: amount(goal.currentSavedAmount),
    monthlyContribution: amount(goal.monthlyContribution), targetDate: date(goal.targetDate),
    createdAt: date(goal.createdAt), contributions: [],
  };
}

function toContribution(value: unknown): GoalContribution {
  const contribution = record(value);
  return {
    id: text(contribution.id), amount: amount(contribution.amount),
    date: date(contribution.contributionDate), description: text(contribution.description ?? ""),
  };
}

async function getPages<T>(path: string, convert: (value: unknown) => T): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; ; page += 1) {
    const response = await api.get<ApiResponse<unknown> & { pagination?: unknown }>(path, {
      params: { page, limit: 100 },
    });
    const data = await unwrapResponse(Promise.resolve(response));
    const pagination = record(response.data.pagination);
    if (!Array.isArray(data) || pagination.page !== page
      || typeof pagination.totalPages !== "number" || !Number.isInteger(pagination.totalPages)
      || pagination.totalPages < 0) {
      throw new Error("The server returned an invalid goals page.");
    }
    items.push(...data.map(convert));
    if (page >= pagination.totalPages) return items;
  }
}

export function getGoals(): Promise<FinancialGoal[]> {
  return getPages("/goals", toGoal);
}

export async function getGoal(id: string): Promise<FinancialGoal> {
  const path = `/goals/${encodeURIComponent(id)}`;
  const [goal, contributions] = await Promise.all([
    unwrapResponse(api.get<ApiResponse<unknown>>(path)).then(toGoal),
    getPages(`${path}/contributions`, toContribution),
  ]);
  return { ...goal, contributions };
}

export async function saveGoal(input: GoalInput, id?: string): Promise<FinancialGoal> {
  const category = Object.entries(categories).find(([, label]) => label === input.category)?.[0];
  if (!category) throw new Error("Please choose a supported goal category.");
  const payload = {
    name: input.name,
    category,
    priority: input.priority.toUpperCase(),
    targetAmount: input.targetAmount,
    targetDate: input.targetDate,
    monthlyContribution: input.monthlyContribution,
    ...(!id ? { initialSavedAmount: input.currentAmount } : {}),
  };
  const result = await unwrapResponse(id
    ? api.patch<ApiResponse<unknown>>(`/goals/${encodeURIComponent(id)}`, payload)
    : api.post<ApiResponse<unknown>>("/goals", payload));
  return toGoal(result);
}

export async function deleteGoal(id: string): Promise<void> {
  await unwrapResponse(api.delete<ApiResponse<unknown>>(`/goals/${encodeURIComponent(id)}`));
}

export async function updateGoalStatus(id: string, status: "Paused" | "On Track"): Promise<FinancialGoal> {
  return toGoal(await unwrapResponse(api.patch<ApiResponse<unknown>>(`/goals/${encodeURIComponent(id)}/status`, {
    status: status === "Paused" ? "PAUSED" : "ACTIVE",
  })));
}

export async function addGoalContribution(id: string, contribution: Omit<GoalContribution, "id">): Promise<void> {
  await unwrapResponse(api.post<ApiResponse<unknown>>(`/goals/${encodeURIComponent(id)}/contributions`, {
    amount: contribution.amount, contributionDate: contribution.date, description: contribution.description,
  }));
}

export async function deleteGoalContribution(id: string, contributionId: string): Promise<void> {
  await unwrapResponse(api.delete<ApiResponse<unknown>>(`/goals/${encodeURIComponent(id)}/contributions/${encodeURIComponent(contributionId)}`));
}
