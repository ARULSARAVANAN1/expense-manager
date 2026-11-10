import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader";
import Icon from "../components/Icon";
import { deleteCategory, getFinanceCategories, getIncomes, saveCategory } from "../services/finance-data.service";
import { getExpenses } from "../services/expense.service";
import type { Expense, FinanceCategory, Income } from "../types/expense";
import { getCategoryStyle } from "../utils.ts/category-style";

function defaultCategoryColor() {
  return getComputedStyle(document.documentElement).getPropertyValue("--category-bills").trim();
}

function CategoriesPage() {
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [editing, setEditing] = useState<FinanceCategory | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("◈");
  const [color, setColor] = useState(defaultCategoryColor);
  const [type, setType] = useState<FinanceCategory["type"]>("expense");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void Promise.all([getFinanceCategories(), getExpenses(), getIncomes()])
      .then(([nextCategories, nextExpenses, nextIncomes]) => {
        if (!active) return;
        setCategories(nextCategories);
        setExpenses(nextExpenses);
        setIncomes(nextIncomes);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "Unable to load categories.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function startEdit(category: FinanceCategory) {
    setEditing(category);
    setName(category.name);
    setIcon(category.icon);
    setColor(category.color);
    setType(category.type);
    setError("");
    setNotice("");
  }

  function resetForm() {
    setEditing(null);
    setName("");
    setIcon("◈");
    setColor(defaultCategoryColor());
    setType("expense");
    setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) {
      setError("Enter a category name.");
      return;
    }
    try {
      await saveCategory({ name: name.trim(), icon: icon.trim() || "◈", color, type }, editing?.id);
      setCategories(await getFinanceCategories());
      setNotice(editing ? "Category updated." : "Category added.");
      resetForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save category.");
    }
  }

  async function remove(category: FinanceCategory) {
    try {
      await deleteCategory(category.id);
      setCategories(await getFinanceCategories());
      setNotice("Category deleted.");
      setError("");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete category.");
    }
  }

  const editedRecords = editing
    ? (editing.type === "expense" ? expenses : incomes).some((record) => record.categoryId === editing.id)
    : false;

  return (
    <>
      <PageHeader title="Categories" subtitle="Organize your income and spending." />
      {notice && <div className="toast-message" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
      {error && <div className="inline-error" role="alert">{error}</div>}
      {loading && <p role="status">Loading categories…</p>}
      <div className="management-layout">
        <section className="content-card">
          <div className="card-heading"><div><h3>Your categories</h3><p>Categories in use cannot be removed to preserve transaction history.</p></div></div>
          <div className="manage-list">
            {categories.map((category) => {
              const related = category.type === "expense" ? expenses : incomes;
              const count = related.filter((record) => record.categoryId === category.id).length;
              return <article className="manage-row" key={category.id}>
                <span className="category-chip-icon manage-icon" style={getCategoryStyle(category)}><Icon name={category.icon} size={20} /></span>
                <div className="manage-row-info"><strong>{category.name}</strong><span><span data-finance-tone={category.type}>{category.type === "expense" ? "Expense" : "Income"}</span> · {count} transaction{count === 1 ? "" : "s"}</span></div>
                <div className="manage-row-actions"><button className="row-action" title="Edit category" aria-label={`Edit ${category.name}`} onClick={() => startEdit(category)}><Icon name="edit" size={16} /></button><button className="row-action delete-row-action" aria-label={`Delete ${category.name}`} disabled={count > 0} title={count ? "This category is used by transactions" : "Delete category"} onClick={() => remove(category)}><Icon name="delete" size={16} /></button></div>
              </article>;
            })}
          </div>
        </section>
        <form className="content-card manage-form" onSubmit={submit}>
          <div className="card-heading"><div><h3>{editing ? "Edit category" : "Add a category"}</h3><p>Choose a name, type, and visual style.</p></div></div>
          <label className="field-label">Category name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Home supplies" /></label>
          <label className="field-label">Type<select value={type} disabled={editedRecords} onChange={(event) => setType(event.target.value as FinanceCategory["type"])}><option value="expense">Expense</option><option value="income">Income</option></select>{editedRecords && <small className="field-hint">Category type is fixed while transactions use it.</small>}</label>
          <div className="form-two-col">
            <label className="field-label">Custom icon<input value={icon} onChange={(event) => setIcon(event.target.value)} maxLength={24} aria-label="Category icon" /></label>
            <label className="field-label">Color<input type="color" value={color} onChange={(event) => setColor(event.target.value)} /></label>
          </div>
          <fieldset className="icon-picker"><legend>Choose an icon</legend><div className="icon-picker-grid">{["food", "groceries", "transport", "shopping", "bills", "health", "entertainment", "travel", "education", "salary", "gift", "sparkle"].map((name) => <button key={name} type="button" title={name} aria-label={`Use ${name} icon`} aria-pressed={icon === name} style={{ color }} onClick={() => setIcon(name)}><Icon name={name} size={21} /></button>)}</div></fieldset>
          <div className="category-style-preview"><span className="manage-icon" style={getCategoryStyle({ id: editing?.id ?? "", name, icon, color })}><Icon name={icon} size={23} /></span><div><strong>{name.trim() || "Your category"}</strong><small>{type === "expense" ? "Expense" : "Income"} category preview</small></div></div>
          <div className="form-actions"><button className="button button-secondary" type="button" onClick={resetForm}><Icon name="reset" size={16} />Clear</button><button className="button button-primary"><Icon name={editing ? "save" : "plus"} size={16} />{editing ? "Save category" : "Add category"}</button></div>
        </form>
      </div>
    </>
  );
}

export default CategoriesPage;
