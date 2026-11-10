import PageHeader from "../components/PageHeader";

export default function RecurringExpensesPage() {
  return (
    <>
      <PageHeader title="Recurring expenses" subtitle="Monthly bills, subscriptions, and regular payments." />
      <section className="content-card">
        <div className="empty-state">
          <h3>Recurring expenses are not available yet</h3>
          <p>The connected API does not currently document recurring-expense endpoints. No recurring data is stored in this browser.</p>
        </div>
      </section>
    </>
  );
}
