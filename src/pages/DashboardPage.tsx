import WelcomeCard from "../components/WelcomeCard";
import Counter from "../components/Counter";

function DashboardPage() {
    return (
        <div>
            <h1>Expense & Finance Manager</h1>
            <p>Dashboard</p>
            <WelcomeCard name="Arul" />
            <Counter />
        </div>
    );
}

export default DashboardPage;