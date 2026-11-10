import DatePicker from "../components/DatePicker";
import { useMemo, useState } from "react";
import Icon from "../components/Icon";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { addExpense, getExpenses, updateExpense } from "../services/expense.service";
import { getAccounts, getCategories } from "../services/finance-data.service";
import type { ExpenseInput } from "../types/expense";
import { formatCurrency, formatDate } from "../utils.ts/finance";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function ExpenseFormPage() {
  const { expenseId } = useParams();
  const isEditing = Boolean(expenseId);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const expenses = useMemo(() => getExpenses(user?.id ?? ""), [user?.id]);
  const expenseCategories = useMemo(() => getCategories(user?.id ?? "", "expense"), [user?.id]);
  const expenseAccounts = useMemo(() => getAccounts(user?.id ?? ""), [user?.id]);
  const existing = expenses.find((expense) => expense.id === expenseId);
  const [amount, setAmount] = useState(existing ? String(existing.amount) : searchParams.get("amount") ?? "");
  const [description, setDescription] = useState(existing?.description ?? searchParams.get("description") ?? "");
  const [categoryId, setCategoryId] = useState(existing?.categoryId ?? "");
  const [accountId, setAccountId] = useState(existing?.accountId ?? expenseAccounts[0]?.id ?? "");
  const draftDate = searchParams.get("date");
  const validDraftDate = draftDate && /^\d{4}-\d{2}-\d{2}$/.test(draftDate) && !Number.isNaN(new Date(`${draftDate}T00:00:00`).getTime());
  const [date, setDate] = useState(existing?.date ?? (validDraftDate ? draftDate : today()));
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const category = expenseCategories.find((item) => item.id === categoryId);
  const account = expenseAccounts.find((item) => item.id === accountId);

  if (isEditing && !existing) return <div className="not-found"><h2>Expense not found</h2><p>This transaction may have been removed.</p><Link className="button button-primary" to="/app/expenses">Back to expenses</Link></div>;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!amount || !Number.isFinite(Number(amount)) || Number(amount) <= 0) nextErrors.amount = "Enter a finite amount greater than zero.";
    if (!description.trim()) nextErrors.description = "Description is required.";
    if (!categoryId) nextErrors.categoryId = "Choose a category.";
    if (!date) nextErrors.date = "Choose an expense date.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || !user) return;
    const selectedCategory = expenseCategories.find((item) => item.id === categoryId);
    const selectedAccount = expenseAccounts.find((item) => item.id === accountId);
    if (!selectedCategory || !selectedAccount) {
      setSubmitError("Choose an available category and account before saving.");
      return;
    }
    const input: ExpenseInput = {
      amount: Number(amount), description: description.trim(), categoryId,
      categoryName: selectedCategory.name, accountId, accountName: selectedAccount.name,
      date, notes: notes.trim() || undefined,
    };
    try {
      setSaving(true);
      const saved = isEditing ? updateExpense(user.id, expenseId!, input) : addExpense(user.id, input);
      navigate(`/app/expenses/${saved.id}`, { replace: true, state: { message: isEditing ? "Expense updated successfully." : "Expense added successfully." } });
    } catch (saveError) {
      setSubmitError(saveError instanceof Error ? saveError.message : "Unable to save this expense.");
      setSaving(false);
    }
  }

  return (
    <>
      <Link to={isEditing ? `/app/expenses/${expenseId}` : "/app/expenses"} className="back-link"><Icon name="back" size={16} />{isEditing ? "Back to expense" : "Back to expenses"}</Link>
      <div className="form-page-heading"><h2>{isEditing ? "Edit expense" : "Add an expense"}</h2><p>{isEditing ? "Update the details of this transaction." : "Add a transaction to keep your spending up to date."}</p></div>
      {submitError && <div className="inline-error" role="alert">{submitError}</div>}
      <div className="expense-form-layout">
        <form className="content-card expense-form" onSubmit={submit} noValidate>
          <div className="form-section-title"><h3>Expense details</h3><p>Fields marked with <b>*</b> are required.</p></div>
          <label className="field-label" htmlFor="expense-amount">Amount <b>*</b><div className={`amount-input${errors.amount ? " has-error" : ""}`}><span>₹</span><input id="expense-amount" type="number" min="0.01" step="0.01" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} aria-invalid={Boolean(errors.amount)} /></div>{errors.amount && <small className="field-error">{errors.amount}</small>}</label>
          <label className="field-label" htmlFor="expense-description">Description / Merchant <b>*</b><input id="expense-description" placeholder="e.g. Grocery shopping" value={description} onChange={(event) => setDescription(event.target.value)} aria-invalid={Boolean(errors.description)} />{errors.description && <small className="field-error">{errors.description}</small>}</label>
          <div className="form-two-col">
            <label className="field-label" htmlFor="expense-category">Category <b>*</b><select id="expense-category" value={categoryId} onChange={(event) => setCategoryId(event.target.value)} aria-invalid={Boolean(errors.categoryId)}><option value="">Select category</option>{expenseCategories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{errors.categoryId && <small className="field-error">{errors.categoryId}</small>}</label>
            <label className="field-label" htmlFor="expense-account">Account / payment method<select id="expense-account" value={accountId} onChange={(event) => setAccountId(event.target.value)}>{expenseAccounts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          </div>
          <label className="field-label" htmlFor="expense-date">Expense date <b>*</b><DatePicker id="expense-date" type="date" value={date} onChange={(value) => setDate(value)} aria-invalid={Boolean(errors.date)} />{errors.date && <small className="field-error">{errors.date}</small>}</label>
          <label className="field-label" htmlFor="expense-notes">Notes <span className="optional-label">Optional</span><textarea id="expense-notes" rows={3} placeholder="Add any additional details..." value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
          <div className="form-actions"><Link className="button button-secondary" to={isEditing ? `/app/expenses/${expenseId}` : "/app/expenses"}>Cancel</Link><button className="button button-primary" disabled={saving}><Icon name="save" size={16} />{saving ? "Saving…" : isEditing ? "Save changes" : "Save expense"}</button></div>
        </form>
        <aside className="preview-card content-card"><div className="card-heading"><div><h3>Live preview</h3><p>How this will appear in your expenses</p></div></div>
          <div className="preview-expense"><div className="preview-icon" style={{ backgroundColor: `${category?.color ?? "#64748b"}1c`, color: category?.color }}><Icon name={category?.icon ?? "categories"} size={22} /></div><div className="preview-description"><strong>{description || "Expense description"}</strong><span>{category?.name ?? "Category"} · {account?.name ?? "UPI"}</span><small>{date ? formatDate(date) : "Expense date"}</small></div></div>
          <div className="preview-amount"><span>Amount</span><strong data-finance-tone="expense">{formatCurrency(Number(amount) || 0)}</strong></div>
          {notes && <p className="preview-notes">{notes}</p>}
        </aside>
      </div>
    </>
  );
}

export default ExpenseFormPage;
