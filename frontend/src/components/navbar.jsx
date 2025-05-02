import "../styles/navbar.css";

function Navbar({ HomePermission, IAMPermission }) {
    const handleLogout = () => {
        localStorage.removeItem("local_cookie");
        window.location.href = "/";
    };
    
    return (
        <nav className="navbar">
            <h1 className="navbar-brand">NalfFlo</h1>
            <div className="navbar-links">
                {HomePermission && (
                    <a href="/home" className="navbar-link">
                        Home
                    </a>
                )}
                {IAMPermission && (
                    <a href="/iam" className="navbar-link">
                        IAM
                    </a>
                )}
                <button onClick={handleLogout} className="logout-button">
                    Logout
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
