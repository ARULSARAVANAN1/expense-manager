import { Outlet } from "react-router-dom";

function AppLayout() {
    return (
        <div>
            <header>
                <h1>Expense & Finance Manager</h1>
            </header>

            <main>
                <Outlet />
            </main>
        </div>
    );
}

export default AppLayout;