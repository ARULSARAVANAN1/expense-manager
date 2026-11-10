import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import Icon from "./Icon";
import { getExpenses } from "../services/expense.service";
import "./AppLayout.css";

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [recurringError] = useState(() => {
    try {
      getExpenses(user?.id ?? "");
      return "";
    } catch (error) {
      console.error("Unable to synchronize recurring expenses.", error);
      return error instanceof Error ? error.message : "Unable to synchronize recurring expenses.";
    }
  });
  const sidebarRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const profileRef = useRef<HTMLDetailsElement>(null);
  const pageTitle = location.pathname.startsWith("/app/expenses")
    ? "Expenses"
    : location.pathname.startsWith("/app/income") ? "Income"
    : location.pathname.startsWith("/app/reports") ? "Reports & Insights"
    : location.pathname.startsWith("/app/categories") ? "Categories"
    : location.pathname.startsWith("/app/accounts") ? "Accounts"
    : location.pathname.startsWith("/app/budgets") ? "Budgets"
    : location.pathname.startsWith("/app/recurring") ? "Recurring expenses"
    : location.pathname.startsWith("/app/profile") ? "Your profile"
    : location.pathname.startsWith("/app/shared") ? "Shared expenses" : "Dashboard";
  const pageIcon = location.pathname.split("/")[2] ?? "dashboard";
  const initial = user?.name?.slice(0, 1).toUpperCase() || "U";
  const dateLabel = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(new Date());

  useEffect(() => {
    function dismissProfile(event: PointerEvent) {
      if (event.target instanceof Node && !profileRef.current?.contains(event.target) && profileRef.current) {
        profileRef.current.open = false;
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && profileRef.current?.open) {
        profileRef.current.open = false;
        profileRef.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", dismissProfile);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissProfile);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sidebarRef.current?.querySelector<HTMLButtonElement>(".sidebar-close")?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
      if (event.key !== "Tab") return;
      const controls = sidebarRef.current?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])");
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    const desktop = window.matchMedia("(min-width: 821px)");
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) setMenuOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKey);
      desktop.removeEventListener("change", closeOnDesktop);
      toggleRef.current?.focus();
    };
  }, [menuOpen]);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="app-shell">
      <a className="skip-navigation" href="#main-content">Skip to content</a>
      <button ref={toggleRef} className="mobile-menu-toggle" type="button" aria-label="Open navigation" aria-controls="app-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><Icon name="menu" /></button>
      {menuOpen && <button className="sidebar-backdrop" aria-label="Close navigation" onClick={() => setMenuOpen(false)} />}
      <aside ref={sidebarRef} id="app-navigation" className={`app-sidebar${menuOpen ? " is-open" : ""}`} role={menuOpen ? "dialog" : undefined} aria-modal={menuOpen || undefined} aria-label="App navigation">
        <button className="sidebar-close" type="button" aria-label="Close navigation" onClick={() => setMenuOpen(false)}><Icon name="close" /></button>
        <NavLink className="brand" to="/app/dashboard" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark"><Icon name="rupee" size={24} /></span><span className="brand-name">Expense Manager<small>Make every rupee count</small></span>
        </NavLink>
        <div className="sidebar-navigation">
        <nav className="sidebar-nav" aria-label="Main navigation">
          <NavLink to="/app/dashboard" onClick={() => setMenuOpen(false)}><Icon name="dashboard" />Dashboard</NavLink>
          <NavLink to="/app/expenses" onClick={() => setMenuOpen(false)}><Icon name="expense" />Expenses</NavLink>
          <NavLink to="/app/income" onClick={() => setMenuOpen(false)}><Icon name="income" />Income</NavLink>
          <NavLink to="/app/reports" onClick={() => setMenuOpen(false)}><Icon name="reports" />Reports</NavLink>
        </nav>
        <p className="nav-section-label">Manage finances</p>
        <nav className="sidebar-nav" aria-label="Finance management">
          <NavLink to="/app/accounts" onClick={() => setMenuOpen(false)}><Icon name="wallet" />Accounts</NavLink>
          <NavLink to="/app/categories" onClick={() => setMenuOpen(false)}><Icon name="categories" />Categories</NavLink>
          <NavLink to="/app/budgets" onClick={() => setMenuOpen(false)}><Icon name="budget" />Budgets</NavLink>
          <NavLink to="/app/recurring" onClick={() => setMenuOpen(false)}><Icon name="recurring" />Recurring expenses</NavLink>
          <NavLink to="/app/shared" onClick={() => setMenuOpen(false)}><Icon name="transactions" />Shared expenses</NavLink>
          <NavLink to="/app/profile" onClick={() => setMenuOpen(false)}><Icon name="profile" />Your profile</NavLink>
        </nav>
        </div>
        <div className="sidebar-bottom">
          <div className="profile-avatar">{initial}</div>
          <Link className="profile-info" to="/app/profile" onClick={() => setMenuOpen(false)} aria-label="View your profile"><strong>{user?.name ?? "User"}</strong><span>{user?.email ?? ""}</span></Link>
          <button className="logout-button" type="button" onClick={handleLogout} aria-label="Log out" title="Log out"><Icon name="logout" /></button>
        </div>
      </aside>
      <div className="app-main" inert={menuOpen}>
        <header className="topbar">
          <div className="topbar-heading"><span className="topbar-page-icon" data-page={pageIcon}><Icon name={pageIcon === "shared" ? "transactions" : pageIcon === "accounts" ? "wallet" : pageIcon === "expenses" ? "expense" : pageIcon === "budgets" ? "budget" : pageIcon} size={21} /></span><h1>{pageTitle}</h1></div>
          <div className="topbar-actions">
            <span className="topbar-date"><Icon name="clock" size={16} />{dateLabel}</span>
            <Link className="topbar-add" to="/app/expenses/new" aria-label="Add expense"><Icon name="plus" size={18} /><span>Add expense</span></Link>
            <details className="topbar-account" ref={profileRef} onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
            }}>
              <summary className="topbar-profile" aria-label="Account options">
                <span className="profile-avatar small" aria-hidden="true">{initial}</span>
                <span>{user?.name ?? "Your account"}</span>
                <span className="profile-dropdown-chevron"><Icon name="next" size={14} /></span>
              </summary>
              <div className="profile-dropdown">
                <div className="profile-dropdown-identity"><strong>{user?.name ?? "Your account"}</strong><span>{user?.email}</span></div>
                <Link to="/app/profile" onClick={() => { if (profileRef.current) profileRef.current.open = false; }}><Icon name="profile" size={17} />Your profile</Link>
                <button className="profile-dropdown-logout" type="button" onClick={handleLogout}><Icon name="logout" size={17} />Log out</button>
              </div>
            </details>
          </div>
        </header>
        <main id="main-content" className="page-content" tabIndex={-1}>{recurringError ? <div className="inline-error" role="alert">{recurringError}<button className="button button-secondary" onClick={() => window.location.reload()}>Retry</button></div> : <Outlet />}</main>
      </div>
    </div>
  );
}

export default AppLayout;