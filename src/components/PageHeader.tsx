import type { ReactNode } from "react";
import Icon from "./Icon";

const pageIcons: Record<string, string> = {
  Dashboard: "dashboard",
  Expenses: "expense",
  Income: "income",
  "Reports & Insights": "reports",
  Categories: "categories",
  Accounts: "wallet",
  Budgets: "budget",
  "Financial Goals": "target",
  "Create a Goal": "target",
  "Edit Goal": "target",
};

interface PageHeaderProps {
  title: string;
  subtitle: string;
  action?: ReactNode;
}

function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="page-heading">
      <div><h2><span className="page-title-icon" data-page={title}><Icon name={pageIcons[title] ?? "dashboard"} size={22} /></span>{title}</h2><p>{subtitle}</p></div>
      {action && <div className="page-heading-action">{action}</div>}
    </div>
  );
}

export default PageHeader;
