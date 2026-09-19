import WelcomeCard from "../components/WelcomeCard";
import Counter from "../components/Counter";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

function DashboardPage() {
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    function handleLogout() {
        logout();
        navigate("/login", { replace: true });
    }

    return (
        <div>
            <h1>Expense & Finance Manager</h1>
            <p>Dashboard</p>
            <button type="button" onClick={handleLogout}>
                Logout
            </button>
            <WelcomeCard name={user?.name ?? "User"} />
            <Counter />
        </div>
    );
}

export default DashboardPage;