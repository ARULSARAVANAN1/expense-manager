interface WelcomeCardProps {
    name: string;
}


function WelcomeCard({ name }: WelcomeCardProps) {
    return (
        <div>
            <h2>Welcome {name} 👋</h2>
            <p>Track your income, expenses and savings.</p>
        </div>
    );
}

export default WelcomeCard;