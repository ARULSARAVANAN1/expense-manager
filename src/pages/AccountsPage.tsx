import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import { deleteAccount, getAccounts, getIncomes, saveAccount } from "../services/finance-data.service";
import { getExpenses } from "../services/expense.service";
import type { Expense, ExpenseAccount, Income } from "../types/expense";

function AccountsPage() {
  const [accounts, setAccounts] = useState<ExpenseAccount[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.all([getAccounts(), getExpenses(), getIncomes()])
      .then(([nextAccounts, nextExpenses, nextIncomes]) => {
        if (!active) return;
        setAccounts(nextAccounts);
        setExpenses(nextExpenses);
        setIncomes(nextIncomes);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load accounts.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await saveAccount(name, editingId || undefined);
      setAccounts(await getAccounts());
      setName("");
      setEditingId("");
      setError("");
      setNotice(editingId ? "Account updated." : "Account added.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save account.");
    }
  }

  async function remove(id: string) {
    try {
      await deleteAccount(id);
      setAccounts(await getAccounts());
      setNotice("Account deleted.");
      setError("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete account.");
    }
  }

  return (
    <>
      <PageHeader title="Accounts" subtitle="Manage the accounts and payment methods used for transactions." />
      {notice && <div className="toast-message" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
      {error && <div className="inline-error" role="alert">{error}</div>}
      {loading && <p className="sr-only" role="status">Loading accounts…</p>}
      <div className="management-layout">
        <section className="content-card"><div className="card-heading"><div><h3>Accounts & payment methods</h3><p>Accounts linked to transactions are protected from deletion.</p></div></div>
          <div className="manage-list">{accounts.map((account) => {
            const count = [...expenses, ...incomes].filter((transaction) => transaction.accountId === account.id).length;
            return <article className="manage-row" key={account.id}><span className="account-icon"><Icon name="wallet" size={21} /></span><div className="manage-row-info"><strong>{account.name}</strong><span>{count} linked transaction{count === 1 ? "" : "s"}</span></div><div className="manage-row-actions"><button className="row-action" title="Edit account" aria-label={`Edit ${account.name}`} onClick={() => { setEditingId(account.id); setName(account.name); }}><Icon name="edit" size={16} /></button><button className="row-action delete-row-action" aria-label={`Delete ${account.name}`} disabled={count > 0} title={count ? "This account is linked to transactions" : "Delete account"} onClick={() => remove(account.id)}><Icon name="delete" size={16} /></button></div></article>;
          })}</div>
        </section>
        <form className="content-card manage-form" onSubmit={save}><div className="card-heading"><div><h3>{editingId ? "Edit account" : "Add an account"}</h3><p>Add a bank, cash, or payment method.</p></div></div><label className="field-label">Account name<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. ICICI Bank" /></label><div className="form-actions">{editingId && <button className="button button-secondary" type="button" onClick={() => { setEditingId(""); setName(""); }}>Cancel</button>}<button className="button button-primary">{editingId ? "Save changes" : "Add account"}</button></div></form>
      </div>
    </>
  );
}

export default AccountsPage;
