import { useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import DatePicker from "../components/DatePicker";
import Icon from "../components/Icon";
import { useAuth } from "../contexts/AuthContext";
import { getAccounts, getCategories } from "../services/finance-data.service";
import { getExpenses } from "../services/expense.service";
import { deleteRecurringExpense, getRecurringExpenses, saveRecurringExpense, type RecurringExpense } from "../services/recurring-expense.service";
import { formatCurrency, formatDate, toDateKey } from "../utils.ts/finance";

export default function RecurringExpensesPage() {
  const { user } = useAuth();
  const userId = user?.id ?? "";
  const [records, setRecords] = useState(() => { getExpenses(userId); return getRecurringExpenses(userId); });
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(toDateKey(new Date()));
  const [endMonth, setEndMonth] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleting, setDeleting] = useState<RecurringExpense | null>(null);
  const categories = getCategories(userId, "expense");
  const accounts = getAccounts(userId);

  function reset() {
    setEditing(null); setDescription(""); setAmount(""); setCategoryId(""); setAccountId("");
    setDate(toDateKey(new Date())); setEndMonth(""); setNotes("");
  }
  function edit(record: RecurringExpense) {
    setEditing(record); setDescription(record.description); setAmount(String(record.amount));
    setCategoryId(record.categoryId); setAccountId(record.accountId); setDate(record.date);
    setEndMonth(record.endMonth); setNotes(record.notes ?? "");
  }
  function save(event: React.FormEvent) {
    event.preventDefault();
    try {
      const category = categories.find((item) => item.id === categoryId);
      const account = accounts.find((item) => item.id === accountId);
      if (!category || !account) throw new Error("Select an expense category and account.");
      saveRecurringExpense(userId, { description: description.trim(), amount: Number(amount), categoryId, categoryName: category.name, accountId, accountName: account.name, date, endMonth, notes: notes.trim() || undefined }, editing?.id);
      getExpenses(userId);
      setRecords(getRecurringExpenses(userId)); setError(""); setNotice("Schedule saved. Due expenses have been added."); reset();
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to save schedule."); }
  }
  function remove() {
    if (!deleting) return;
    try {
      deleteRecurringExpense(userId, deleting.id);
      if (editing?.id === deleting.id) reset();
      setRecords(getRecurringExpenses(userId)); setDeleting(null); setError(""); setNotice("Schedule deleted. Existing expenses are unchanged.");
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to delete schedule."); setDeleting(null); }
  }
  return <>
    <PageHeader title="Recurring expenses" subtitle="Monthly bills, subscriptions, and regular payments." action={<Link className="button button-secondary" to="/app/expenses">View expenses</Link>} />
    {error && <div className="inline-error" role="alert">{error}</div>}
    {notice && <div className="toast-message" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
    <div className="management-layout">
      <section className="content-card">
        <div className="card-heading"><div><h3>Monthly schedules</h3><p>Due expenses are created on app open, including missed months. The 29th–31st adjust to the last day of shorter months. No background payments are made.</p></div></div>
        {records.length ? records.map((record) => <article className="budget-row" key={record.id}>
          <div className="budget-row-top"><div><strong>{record.description}</strong><span>{record.categoryName} · {record.accountName}</span></div><div className="manage-row-actions"><button className="row-action" aria-label={`Edit ${record.description}`} onClick={() => edit(record)}><Icon name="edit" /></button><button className="row-action delete-row-action" aria-label={`Delete ${record.description}`} onClick={() => setDeleting(record)}><Icon name="delete" /></button></div></div>
          <div className="budget-amounts"><strong data-finance-tone="expense">{formatCurrency(record.amount)} / month</strong><span>Day {Number(record.date.slice(8))}</span></div>
          <small>From {formatDate(record.date)}{record.endMonth ? ` · Ends ${record.endMonth}` : " · No end date"}{record.completedThrough ? ` · Created through ${record.completedThrough}` : " · Awaiting first due date"}</small>
        </article>) : <div className="empty-state"><Icon name="clock" size={28} /><h3>No recurring expenses</h3><p>Create your first monthly schedule.</p></div>}
      </section>
      <form className="content-card manage-form" onSubmit={save}>
        <div className="card-heading"><div><h3>{editing ? "Edit schedule" : "Add recurring expense"}</h3><p>Edits affect only future expenses, not existing transactions.</p></div></div>
        <label className="field-label">Description<input required value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label className="field-label">Amount (INR)<input required type="number" min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></label>
        <label className="field-label">Category<select required value={categoryId} onChange={(event) => setCategoryId(event.target.value)}><option value="">Select category</option>{categories.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        <label className="field-label">Account<select required value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="">Select account</option>{accounts.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
        {editing ? <p className="field-hint">Start date: {formatDate(date)} (fixed). Create a new schedule to change the billing day.</p> : <label className="field-label">First due date<DatePicker required value={date} min="2000-01-01" onChange={setDate} /></label>}
        <label className="field-label">End month (optional)<DatePicker type="month" value={endMonth} min={date.slice(0, 7)} onChange={setEndMonth} /></label>
        <label className="field-label">Notes<textarea rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
        <div className="form-actions">{editing && <button className="button button-secondary" type="button" onClick={reset}>Cancel</button>}<button className="button button-primary">Save schedule</button></div>
      </form>
    </div>
    {deleting && <div className="dialog-backdrop"><section className="confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-recurring-title"><h3 id="delete-recurring-title">Delete recurring schedule?</h3><p>Future expenses for {deleting.description} will stop. Previously created expenses will be kept.</p><div className="dialog-actions"><button className="button button-secondary" onClick={() => setDeleting(null)}>Cancel</button><button className="button button-danger" onClick={remove}>Delete schedule</button></div></section></div>}
  </>;
}
