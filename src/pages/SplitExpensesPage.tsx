import PageHeader from "../components/PageHeader";

export default function SplitExpensesPage() {
  return (
    <>
      <PageHeader title="Shared expenses" subtitle="Split a payment you made equally, including your own share." />
      <section className="content-card">
        <div className="empty-state">
          <h3>Shared expenses are not available yet</h3>
          <p>The connected API does not currently document shared-expense endpoints. No split data is stored in this browser.</p>
        </div>
      </section>
    </>
  );
}
