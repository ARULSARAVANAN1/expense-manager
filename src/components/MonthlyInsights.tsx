import { useState } from "react";
import { Link } from "react-router-dom";
import type { Budget, Expense, ExpenseCategory, Income } from "../types/expense";
import { monthlyInsights, monthDays } from "../utils.ts/insights";
import { formatCurrency, formatDate, toDateKey } from "../utils.ts/finance";
import Icon from "./Icon";
import "./MonthlyInsights.css";

interface Props {
  month: string;
  expenses: Expense[];
  incomes: Income[];
  categories: ExpenseCategory[];
  budgets: Budget[];
}

export default function MonthlyInsights({ month, expenses, incomes, categories, budgets }: Props) {
  const [reductions, setReductions] = useState<Record<string, number>>({});
  const insight = monthlyInsights(month, expenses, incomes, budgets, categories);
  const [year, number] = month.split("-").map(Number);
  const firstDay = new Date(year, number - 1, 1).getDay();
  const totals = new Map<string, number>();
  insight.monthly.forEach((expense) => totals.set(expense.date, (totals.get(expense.date) ?? 0) + expense.amount));
  const peak = Math.max(0, ...totals.values());
  const savings = insight.categoryTotals.reduce((sum, item) => sum + Math.round(item.spent * (reductions[item.id] ?? 0)) / 100, 0);
  const label = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(year, number - 1, 1));
  const current = month === toDateKey(new Date()).slice(0, 7);
  return <section className="month-insights" aria-label={`${label} insights`}>
    <div className="insight-grid">
      <article className="content-card safe-spend-card">
        <div className="card-heading"><div><h3><Icon name="wallet" />Safe-to-spend estimate</h3><p>{label} planning estimate, not your bank balance.</p></div></div>
        <strong className="insight-main-value" data-finance-tone={insight.balance < 0 ? "negative" : "positive"}>{formatCurrency(Math.max(0, insight.balance))}</strong>
        {insight.balance < 0 && <p data-finance-tone="negative">Planning shortfall: {formatCurrency(-insight.balance)}</p>}
        <dl className="insight-breakdown"><div><dt>Recorded income</dt><dd data-finance-tone="income">{formatCurrency(insight.income)}</dd></div><div><dt>Recorded expenses</dt><dd data-finance-tone="expense">{formatCurrency(insight.total)}</dd></div><div><dt>Reserved for budgets & commitments</dt><dd>{formatCurrency(insight.reserve)}</dd></div></dl>
        <p className="field-hint">Income minus expenses minus unused budget reserves. Includes all dated records in this month; excludes bank balances, expected income, recurring expenses, and unsettled splits.</p>
        {insight.remainingDays > 0 && <p><strong>{formatCurrency(Math.max(0, insight.balance) / insight.remainingDays)}</strong> per {current ? "remaining" : "calendar"} day ({insight.remainingDays} days{current ? ", including today" : ""}).</p>}
        {insight.allocations.some((item) => item.budget > 0) && <details className="insight-details"><summary>Category room after recurring commitments</summary>{insight.allocations.filter((item) => item.budget > 0).map((item) => <p key={item.id}>{item.name}<strong>{formatCurrency(item.available)}</strong></p>)}</details>}
        {!insight.income && <p className="field-hint">No income recorded for this month. Add income for a meaningful estimate.</p>}
      </article>
      <article className="content-card">
        <div className="card-heading"><div><h3><Icon name="sparkle" />Monthly money story</h3><p>A factual recap from your records, no AI service required.</p></div></div>
        {insight.monthly.length ? <ul className="money-story">
          <li>You recorded <strong>{insight.monthly.length} expenses</strong> totaling <strong data-finance-tone="expense">{formatCurrency(insight.total)}</strong> in {label}.</li>
          {insight.categoryTotals[0] && <li><strong>{insight.categoryTotals[0].name}</strong> led spending at {formatCurrency(insight.categoryTotals[0].spent)} ({Math.round(insight.categoryTotals[0].spent / insight.total * 100)}% of the total).</li>}
          {insight.largest && <li>Your largest expense was <strong>{insight.largest.description}</strong>, {formatCurrency(insight.largest.amount)} on {formatDate(insight.largest.date)}.</li>}
          {month <= toDateKey(new Date()).slice(0, 7) && <li>{insight.previousTotal > 0 ? <>Spending is <strong>{Math.abs((insight.comparisonTotal / insight.previousTotal - 1) * 100).toFixed(1)}% {insight.comparisonTotal >= insight.previousTotal ? "higher" : "lower"}</strong> than {current ? "the same elapsed days of" : "the full"} previous month.</> : "No comparable previous-month spending is recorded yet."}</li>}
        </ul> : <div className="empty-state"><h3>Your story starts with an expense</h3><p>Add transactions for {label} to see your recap.</p></div>}
      </article>
    </div>
    <div className="insight-grid">
      <article className="content-card spending-calendar">
        <div className="card-heading"><div><h3><Icon name="clock" />Spending calendar</h3><p>{label}. Select a day to view its expenses.</p></div></div>
        <div className="spending-calendar-grid">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <span className="calendar-weekday" key={day}>{day}</span>)}
          {Array.from({ length: firstDay }, (_, index) => <span key={`blank-${index}`} />)}
          {Array.from({ length: monthDays(month) }, (_, index) => {
            const date = `${month}-${String(index + 1).padStart(2, "0")}`;
            const amount = totals.get(date) ?? 0;
            const heat = !amount ? 0 : amount / peak > 0.66 ? 3 : amount / peak > 0.33 ? 2 : 1;
            return <Link key={date} to={`/app/expenses?from=${date}&to=${date}`} className={`spending-day heat-${heat}`} aria-label={`${formatDate(date)}: ${formatCurrency(amount)}. View expenses.`} aria-current={date === toDateKey(new Date()) ? "date" : undefined}><span>{index + 1}</span><small>{amount ? formatCurrency(amount) : "-"}</small></Link>;
          })}
        </div>
        <p className="field-hint">Lighter to darker green = lower to higher daily spending relative to this month's peak. Amounts are shown on every spending day.</p>
      </article>
      <article className="content-card">
        <div className="card-heading"><div><h3><Icon name="warning" />Smart spending alerts</h3><p>Transparent rules based on this month's records.</p></div></div>
        {insight.alerts.length ? <ul className="spending-alerts">{insight.alerts.map((alert) => <li key={alert.id}><strong data-finance-tone={alert.tone}>{alert.title}</strong><p>{alert.detail}</p></li>)}</ul> : <div className="empty-state"><h3>{insight.monthly.length ? "No rules triggered" : "Not enough activity yet"}</h3><p>Alerts appear at 80% budget usage, category increases of at least 50% against a prior baseline of INR 500, or unusually large transactions with at least 5 monthly records.</p></div>}
      </article>
    </div>
    <article className="content-card savings-simulator">
      <div className="card-heading"><div><h3><Icon name="budget" />What-if savings simulator</h3><p>Adjust category spending for {label}. This experiment never changes expenses or budgets.</p></div><button className="reset-button" onClick={() => setReductions({})}>Reset scenario</button></div>
      {insight.categoryTotals.length ? <>
        <div className="simulator-layout"><div>{insight.categoryTotals.map((item) => <label className="simulator-row" key={item.id}><span>{item.name}<strong>{reductions[item.id] ?? 0}% less</strong></span><input type="range" min="0" max="100" step="5" value={reductions[item.id] ?? 0} onChange={(event) => setReductions({ ...reductions, [item.id]: Number(event.target.value) })} /><small>{formatCurrency(item.spent)} → {formatCurrency(item.spent - Math.round(item.spent * (reductions[item.id] ?? 0)) / 100)}</small></label>)}</div>
          <div className="simulator-result" aria-live="polite"><span>Potential savings for this month</span><strong data-finance-tone="positive">{formatCurrency(savings)}</strong><p>Adjusted spending: {formatCurrency(insight.total - savings)}</p><p>12-month illustration: {formatCurrency(savings * 12)}</p><small>Assumes this month's pattern repeats unchanged, not a forecast or guaranteed savings.</small></div></div>
      </> : <p className="field-hint">Add expenses for this month to try a scenario.</p>}
    </article>
  </section>;
}
