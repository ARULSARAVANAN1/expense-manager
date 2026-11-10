import DatePicker from "../components/DatePicker";
import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import SummaryCard from "../components/SummaryCard";
import { deleteBudget, getBudgets, getCategories, saveBudget } from "../services/finance-data.service";
import { getExpenses } from "../services/expense.service";
import { formatCurrency, toDateKey } from "../utils.ts/finance";
import type { Budget, Expense, ExpenseCategory } from "../types/expense";

function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const currentMonth = toDateKey(new Date()).slice(0, 7);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(currentMonth);
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.all([getBudgets(), getCategories("expense"), getExpenses()])
      .then(([nextBudgets, nextCategories, nextExpenses]) => {
        if (!active) return;
        setBudgets(nextBudgets);
        setCategories(nextCategories);
        setExpenses(nextExpenses);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load budgets.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const monthlyBudgets = budgets.filter((budget) => budget.month === currentMonth);
  const totalBudget = monthlyBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = expenses.filter((expense) => expense.date.startsWith(currentMonth)).reduce((sum, expense) => sum + expense.amount, 0);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const category = categories.find((item) => item.id === categoryId);
    if (!category || Number(amount) <= 0) {
      setError("Choose a category and enter a budget greater than zero.");
      return;
    }

    try {
      await saveBudget({ categoryId, categoryName: category.name, amount: Number(amount), month }, editingId || undefined);
      setBudgets(await getBudgets());
      setCategoryId("");
      setAmount("");
      setEditingId("");
      setError("");
      setNotice(editingId ? "Budget updated." : "Budget added.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save budget.");
    }
  }

  async function removeBudget(id: string) {
    try {
      await deleteBudget(id);
      setBudgets(await getBudgets());
      setNotice("Budget deleted.");
      setError("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete budget.");
    }
  }

  return (
    <>
      <PageHeader title="Budgets" subtitle="Set monthly category limits and keep an eye on your spending." />
      {notice && <div className="toast-message" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
      {error && <div className="inline-error" role="alert">{error}</div>}
      {loading && <p className="sr-only" role="status">Loading budgets…</p>}
      <section className="summary-grid summary-grid-three">
        <SummaryCard label="Monthly budget" value={formatCurrency(totalBudget)} detail={`For ${currentMonth}`} icon="budget" tone="blue" />
        <SummaryCard label="Spent this month" value={formatCurrency(totalSpent)} detail="Across all categories" icon="expense" tone="red" valueTone="expense" />
        <SummaryCard label="Remaining" value={formatCurrency(totalBudget - totalSpent)} detail="Budget less total expenses" icon="wallet" tone={totalBudget >= totalSpent ? "green" : "red"} valueTone={totalBudget === totalSpent ? undefined : totalBudget > totalSpent ? "positive" : "negative"} />
      </section>
      <div className="management-layout">
        <section className="content-card"><div className="card-heading"><div><h3>Category budgets</h3><p>Progress is calculated from your expense transactions.</p></div></div>
          <div className="budget-list">{budgets.length ? budgets.map((budget) => {
            const spent = budget.spent ?? expenses.filter((expense) => expense.categoryId === budget.categoryId && expense.date.startsWith(budget.month)).reduce((sum, expense) => sum + expense.amount, 0);
            const percent = Math.round(spent / budget.amount * 100);
            const usage = spent / budget.amount;
            const statusTone = usage >= 1 ? "negative" : usage >= 0.8 ? "warning" : "positive";
            return <article className="budget-row" key={budget.id}><div className="budget-row-top"><div><strong>{budget.categoryName}</strong><span>{budget.month}</span></div><div className="manage-row-actions"><button className="row-action" title="Edit budget" aria-label={`Edit ${budget.categoryName} budget`} onClick={() => { setEditingId(budget.id); setCategoryId(budget.categoryId); setAmount(String(budget.amount)); setMonth(budget.month); }}><Icon name="edit" size={16} /></button><button className="row-action delete-row-action" title="Delete budget" aria-label={`Delete ${budget.categoryName} budget`} onClick={() => removeBudget(budget.id)}><Icon name="delete" size={16} /></button></div></div><div className="budget-amounts"><span data-finance-tone="expense">{formatCurrency(spent)} spent</span><strong>{formatCurrency(budget.amount)}</strong></div><div className="budget-progress"><span data-finance-tone={statusTone} style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: "currentColor" }} /></div><small data-finance-tone={statusTone}>{percent}% used{usage > 1 ? " · Over budget" : usage === 1 ? " · Limit reached" : usage >= 0.8 ? " · Near limit" : " · Within budget"}</small></article>;
          }) : <div className="empty-state"><span>◷</span><h3>No budgets yet</h3><p>Create a category budget to start tracking progress.</p></div>}</div>
        </section>
        <form className="content-card manage-form" onSubmit={submit}><div className="card-heading"><div><h3>{editingId ? "Edit budget" : "Create a budget"}</h3><p>Set a spending limit for a category and month.</p></div></div><label className="field-label">Category<select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label className="field-label">Monthly limit (INR)<input type="number" min="0.01" step="0.01" required value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0.00" /></label><label className="field-label">Month<DatePicker type="month" required value={month} onChange={(value) => setMonth(value)} /></label><div className="form-actions">{editingId && <button className="button button-secondary" type="button" onClick={() => { setEditingId(""); setCategoryId(""); setAmount(""); }}>Cancel</button>}<button className="button button-primary">{editingId ? "Save budget" : "Add budget"}</button></div></form>
      </div>
    </>
  );
}

export default BudgetsPage;
