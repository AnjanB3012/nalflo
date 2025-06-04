import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/navbar';
import '../styles/management.css';

const Management = () => {
    const [businessRules, setBusinessRules] = useState([]);
    const [newRule, setNewRule] = useState('');
    const [error, setError] = useState('');
    const [permissions, setPermissions] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserData = async () => {
            const cookieData = localStorage.getItem("local_cookie");
            if (!cookieData) {
                navigate('/login');
                return;
            }

            const parsedCookie = JSON.parse(cookieData);
            const cookieToken = parsedCookie.token;

            try {
                // Fetch permissions
                const response = await fetch("http://localhost:8080/api/getUserPermissions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ cookie_token: cookieToken }),
                });
                const data = await response.json();

                if (data.message === "Success") {
                    if (!data.permissions.management) {
                        setError("You don't have permission to access management");
                        setLoading(false);
                        return;
                    }
                    setPermissions(data.permissions);
                    fetchBusinessRules(cookieToken);
                } else {
                    setError("Failed to fetch permissions");
                    setLoading(false);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setError("Failed to connect to the server");
                setLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const fetchBusinessRules = async (cookieToken) => {
        try {
            const response = await fetch('http://localhost:8080/api/home/getBusinessRules', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cookie_token: cookieToken
                })
            });

            const data = await response.json();
            if (data.message === "Success") {
                setBusinessRules(data.businessRules);
            } else {
                setError('Failed to fetch business rules');
            }
        } catch (error) {
            setError('Failed to fetch business rules');
        } finally {
            setLoading(false);
        }
    };

    const handleAddRule = async () => {
        if (!newRule.trim()) {
            setError('Rule cannot be empty');
            return;
        }

        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setError('Please log in to add a rule');
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        try {
            const response = await fetch('http://localhost:8080/api/home/addBusinessRule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cookie_token: parsedCookie.token,
                    businessRule: newRule.trim()
                })
            });

            const data = await response.json();
            if (data.message === "Success") {
                setNewRule('');
                setError('');
                fetchBusinessRules(parsedCookie.token);
            } else {
                setError('Failed to add business rule');
            }
        } catch (error) {
            setError('Failed to add business rule');
        }
    };

    const handleRemoveRule = async (rule) => {
        const cookieData = localStorage.getItem("local_cookie");
        if (!cookieData) {
            setError('Please log in to remove a rule');
            return;
        }

        const parsedCookie = JSON.parse(cookieData);
        try {
            const response = await fetch('http://localhost:8080/api/home/removeBusinessRule', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cookie_token: parsedCookie.token,
                    businessRule: rule
                })
            });

            const data = await response.json();
            if (data.message === "Success") {
                fetchBusinessRules(parsedCookie.token);
            } else {
                setError('Failed to remove business rule');
            }
        } catch (error) {
            setError('Failed to remove business rule');
        }
    };

    if (error) {
        return (
            <div className="management-container">
                <Navbar 
                    HomePermission={permissions?.home} 
                    IAMPermission={permissions?.iam} 
                    apisPermission={permissions?.development}
                    managementPermission={permissions?.management}
                />
                <div className="error-message">
                    <h2>Something went wrong</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="management-container">
                <Navbar 
                    HomePermission={permissions?.home} 
                    IAMPermission={permissions?.iam} 
                    apisPermission={permissions?.development}
                    managementPermission={permissions?.management}
                />
                <div className="loading-message">
                    <h2>Loading...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="management-container">
            <Navbar 
                HomePermission={permissions?.home} 
                IAMPermission={permissions?.iam} 
                apisPermission={permissions?.development}
                managementPermission={permissions?.management}
            />
            <div className="main-content">
                <h1>Business Rules Management</h1>
                
                {error && <div className="error-message">{error}</div>}
                
                <div className="rules-table-container">
                    <table className="rules-table">
                        <thead>
                            <tr>
                                <th>Business Rule</th>
                            </tr>
                        </thead>
                        <tbody>
                            {businessRules.map((rule, index) => (
                                <tr key={index}>
                                    <td>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span>{rule}</span>
                                            <button 
                                                className="remove-button"
                                                onClick={() => handleRemoveRule(rule)}
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="add-rule-container">
                    <input
                        type="text"
                        value={newRule}
                        onChange={(e) => setNewRule(e.target.value)}
                        placeholder="Enter new business rule"
                        className="rule-input"
                    />
                    <button 
                        onClick={handleAddRule}
                        className="add-button"
                    >
                        Add Rule
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Management; 