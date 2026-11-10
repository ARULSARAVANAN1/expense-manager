import DatePicker from "../components/DatePicker";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import SummaryCard from "../components/SummaryCard";
import { useAuth } from "../contexts/AuthContext";
import { addIncome, deleteIncome, getAccounts, getCategories, getIncomes, updateIncome } from "../services/finance-data.service";
import type { ExpenseAccount, ExpenseCategory, Income } from "../types/expense";
import { formatCurrency, formatDate, toDateKey } from "../utils.ts/finance";
import { getCategoryStyle } from "../utils.ts/category-style";

function IncomePage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [searchParams] = useSearchParams();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [accounts, setAccounts] = useState<ExpenseAccount[]>([]);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const [editing, setEditing] = useState<Income | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<Income | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(toDateKey(new Date()));
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getIncomes(),
      getCategories("income"),
      getAccounts(),
    ]).then(([nextIncomes, nextCategories, nextAccounts]) => {
      if (!active) return;
      setIncomes(nextIncomes);
      setCategories(nextCategories);
      setAccounts(nextAccounts);
    }).catch((loadError: unknown) => {
      if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load income data.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const filtered = incomes.filter((income) =>
    (!query || income.description.toLowerCase().includes(query.toLowerCase()) || (income.notes ?? "").toLowerCase().includes(query.toLowerCase()))
    && (!categoryFilter || income.categoryId === categoryFilter)
    && (!from || income.date >= from)
    && (!to || income.date <= to),
  ).sort((a, b) => b.date.localeCompare(a.date));
  const total = filtered.reduce((sum, income) => sum + income.amount, 0);

  function resetForm() {
    setFormOpen(false);
    setEditing(null); setAmount(""); setDescription(""); setCategoryId(""); setAccountId(accounts[0]?.id ?? ""); setDate(toDateKey(new Date())); setNotes(""); setError("");
  }

  function startEdit(income: Income) {
    setFormOpen(true);
    setEditing(income); setAmount(String(income.amount)); setDescription(income.description); setCategoryId(income.categoryId); setAccountId(income.accountId ?? ""); setDate(income.date); setNotes(income.notes ?? ""); setError("");
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const category = categories.find((item) => item.id === categoryId);
    const account = accounts.find((item) => item.id === accountId);
    if (Number(amount) <= 0 || !description.trim() || !category || (accountId && !account) || !date) {
      setError("Enter a valid amount, description, category, and date.");
      return;
    }
    try {
      const input = {
        amount: Number(amount), description: description.trim(), categoryId,
        categoryName: category.name, accountId: account?.id, accountName: account?.name,
        date, notes: notes.trim() || undefined,
      };
      if (editing) await updateIncome(editing.id, input);
      else await addIncome(input);
      setIncomes(await getIncomes());
      setNotice(editing ? "Income updated." : "Income added.");
      resetForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save income.");
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await deleteIncome(deleting.id);
      setIncomes(await getIncomes());
      setDeleting(null);
      setNotice("Income deleted.");
      setError("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete income.");
      setDeleting(null);
    }
  }

  const currentMonth = toDateKey(new Date()).slice(0, 7);
  const currentMonthTotal = incomes.filter((income) => income.date.startsWith(currentMonth)).reduce((sum, income) => sum + income.amount, 0);
  const average = filtered.length ? total / filtered.length : 0;

  return (
    <>
      <PageHeader title="Income" subtitle="Record and review the money coming in." action={<button className="button button-primary" onClick={() => { resetForm(); setFormOpen(true); }}><Icon name="plus" />Add income</button>} />
      {notice && <div className="toast-message" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
      {error && !editing && <div className="inline-error" role="alert">{error}</div>}
      {loading && <p className="sr-only" role="status">Loading income…</p>}
      <section className="summary-grid summary-grid-three">
        <SummaryCard label="Income this month" value={formatCurrency(currentMonthTotal)} detail="Across all income sources" icon="↗" tone="green" valueTone="income" />
        <SummaryCard label="Filtered income" value={formatCurrency(total)} detail="Matching records" icon="₹" tone="green" valueTone="income" />
        <SummaryCard label="Average income" value={formatCurrency(average)} detail={`${filtered.length} transaction${filtered.length === 1 ? "" : "s"}`} icon="◷" tone="green" valueTone="income" />
      </section>
      <section className="content-card expenses-list-card">
        <div className="filter-toolbar">
          <label className="search-field"><Icon name="search" /><input aria-label="Search income" placeholder="Search income..." value={query} onChange={(event) => setQuery(event.target.value)} /></label>
          <select className="select-control" aria-label="Filter income by category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}><option value="">All income categories</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>
          <div className="date-range-filters">
            <label className="date-range-field"><span>From</span><DatePicker aria-label="Start date" type="date" value={from} onChange={(value) => setFrom(value)} /></label>
            <label className="date-range-field"><span>To</span><DatePicker aria-label="End date" type="date" value={to} onChange={(value) => setTo(value)} /></label>
          </div>
          <button className="reset-button" type="button" onClick={() => { setQuery(""); setCategoryFilter(""); setFrom(""); setTo(""); }}>Reset</button>
        </div>
        {filtered.length ? <div className="table-scroll"><table className="data-table income-table"><thead><tr><th>Date</th><th>Description</th><th>Category</th><th>Account</th><th className="align-right">Amount</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((income) => {
          const category = categories.find((item) => item.id === income.categoryId);
          return <tr key={income.id}><td data-label="Date">{formatDate(income.date)}</td><td data-label="Description"><span className="table-description">{income.description}</span>{income.notes && <small className="table-note">{income.notes}</small>}</td><td data-label="Category"><span className="category-chip"><span className="category-chip-icon" style={getCategoryStyle(category)}><Icon name={category?.icon ?? "income"} size={16} /></span>{income.categoryName}</span></td><td data-label="Account">{income.accountName ?? "No account"}</td><td data-label="Amount" className="align-right amount-cell income-amount">{formatCurrency(income.amount)}</td><td><div className="row-actions"><button className="row-action" title="Edit income" aria-label={`Edit ${income.description}`} onClick={() => startEdit(income)}><Icon name="edit" size={15} /></button><button className="row-action delete-row-action" title="Delete income" aria-label={`Delete ${income.description}`} onClick={() => setDeleting(income)}><Icon name="delete" size={15} /></button></div></td></tr>;
        })}</tbody></table></div> : <div className="empty-state"><span>↗</span><h3>No income found</h3><p>Add an income record or adjust the filters.</p></div>}
      </section>
      {formOpen && <div className="dialog-backdrop" onClick={resetForm}><form className="content-card income-dialog" role="dialog" aria-modal="true" aria-labelledby="income-form-title" onSubmit={save} onClick={(event) => event.stopPropagation()}><div className="card-heading"><div><h3 id="income-form-title">{editing ? "Edit income" : "Add income"}</h3><p>Enter the details for this income transaction.</p></div><button type="button" className="dialog-close" aria-label="Close form" onClick={resetForm}>×</button></div>{error && <div className="inline-error" role="alert">{error}</div>}<label className="field-label" htmlFor="income-amount">Amount (INR)<input id="income-amount" type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></label><label className="field-label" htmlFor="income-description">Description<input id="income-description" required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="e.g. Monthly salary" /></label><div className="form-two-col"><label className="field-label">Category<select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Select category</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label className="field-label">Account (optional)<select value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="">No account</option>{accounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div><label className="field-label">Date<DatePicker required type="date" value={date} onChange={(value) => setDate(value)} /></label><label className="field-label">Notes<textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} /></label><div className="form-actions"><button type="button" className="button button-secondary" onClick={resetForm}>Cancel</button><button className="button button-primary">{editing ? "Save changes" : "Save income"}</button></div></form></div>}
      {deleting && <div className="dialog-backdrop" onClick={() => setDeleting(null)}><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="income-delete-title" onClick={(event) => event.stopPropagation()}><div className="dialog-icon">!</div><h3 id="income-delete-title">Delete this income?</h3><p>Delete “{deleting.description}”? This action cannot be undone.</p><div className="dialog-actions"><button className="button button-secondary" onClick={() => setDeleting(null)}>Cancel</button><button className="button button-danger" onClick={confirmDelete}>Delete income</button></div></section></div>}
    </>
  );
}

export default IncomePage;
