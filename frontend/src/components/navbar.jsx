function Navbar({ HomePermission, IAMPermission }) {
    return (
        <nav
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#032cfc',
                padding: '15px 30px',
                color: 'white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
        >
            <h1 style={{ margin: 0, fontSize: '24px' }}>NalfFlo</h1>
            <div style={{ display: 'flex', gap: '20px' }}>
                {HomePermission && (
                    <a
                        href="/home"
                        style={{
                            color: 'white',
                            textDecoration: 'none',
                            fontSize: '16px',
                            fontWeight: '500',
                        }}
                    >
                        Home
                    </a>
                )}
                {IAMPermission && (
                    <a
                        href="/iam"
                        style={{
                            color: 'white',
                            textDecoration: 'none',
                            fontSize: '16px',
                            fontWeight: '500',
                        }}
                    >
                        IAM
                    </a>
                )}
            </div>
        </nav>
    );
}

export default Navbar;
