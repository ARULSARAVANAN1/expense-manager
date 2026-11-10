import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";

const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const ExpensesPage = lazy(() => import("./pages/ExpensesPage"));
const ExpenseDetailsPage = lazy(() => import("./pages/ExpenseDetailsPage"));
const ExpenseFormPage = lazy(() => import("./pages/ExpenseFormPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const IncomePage = lazy(() => import("./pages/IncomePage"));
const CategoriesPage = lazy(() => import("./pages/CategoriesPage"));
const AccountsPage = lazy(() => import("./pages/AccountsPage"));
const BudgetsPage = lazy(() => import("./pages/BudgetsPage"));
const RecurringExpensesPage = lazy(() => import("./pages/RecurringExpensesPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));

function Page({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div className="route-loading">Loading page…</div>}>{children}</Suspense>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<Page><DashboardPage /></Page>} />
            <Route path="expenses" element={<Page><ExpensesPage /></Page>} />
            <Route path="expenses/new" element={<Page><ExpenseFormPage /></Page>} />
            <Route path="expenses/:expenseId/edit" element={<Page><ExpenseFormPage /></Page>} />
            <Route path="expenses/:expenseId" element={<Page><ExpenseDetailsPage /></Page>} />
            <Route path="income" element={<Page><IncomePage /></Page>} />
            <Route path="reports" element={<Page><ReportsPage /></Page>} />
            <Route path="accounts" element={<Page><AccountsPage /></Page>} />
            <Route path="categories" element={<Page><CategoriesPage /></Page>} />
            <Route path="budgets" element={<Page><BudgetsPage /></Page>} />
            <Route path="recurring" element={<Page><RecurringExpensesPage /></Page>} />
            <Route path="profile" element={<Page><ProfilePage /></Page>} />
          </Route>
        </Route>

        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;