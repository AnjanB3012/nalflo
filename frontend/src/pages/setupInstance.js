import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function SetupInstance() {
    const [step, setStep] = useState(0);
    const [formData, setFormData] = useState({
        customerName: '',
        adminPassword: '',
        contactEmail: '',
        domain: '',
    });
    const [data, setData] = useState(null);
    const navigate = useNavigate();

    const steps = [
        { label: 'Customer Name', field: 'customerName', placeholder: 'Enter Customer Name' },
        { label: 'Admin Password', field: 'adminPassword', placeholder: 'Enter Admin Password' },
        { label: 'Contact Email', field: 'contactEmail', placeholder: 'Enter Contact Email' },
        { label: 'Domain', field: 'domain', placeholder: 'Enter Domain' },
    ];

    useEffect(() => {
        fetch("http://localhost:8080/api/homeCheck")
            .then((response) => response.json())
            .then((data) => setData(data))
            .catch((error) => console.error("Error fetching data:", error));
    }, []);

    useEffect(() => {
        if (data) {
            if (data.message === "1") {
                navigate("/login");
            } else if (data.message === "0") {
                navigate("/setup");
            }
        }
    }, [data, navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [steps[step].field]: e.target.value,
        });
    };

    const handlePost = () => {
        fetch('http://localhost:8080/api/setupInstance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.message === "Instance is Setup") {
                    alert("Instance setup successfully!");
                    window.location.href = "/login";
                } else {
                    alert("Error setting up instance. Please try again.");
                }
            })
            .catch((error) => {
                console.error("Error:", error);
                alert("An error occurred. Please try again.");
            });
    };

    const handleNext = () => {
        if (step === steps.length - 1) {
            handlePost();
        } else {
            setStep(step + 1);
        }
    };

    const handlePrevious = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    if (!data) {
        return <div style={{ color: '#032cfc', textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
    }

    return (
        <div
            style={{
                width: '350px',
                margin: 'auto',
                marginTop: '80px',
                padding: '30px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ffffff, #e0e7ff)',
                boxShadow: '0 4px 12px rgba(3, 44, 252, 0.2)',
            }}
        >
            <h2 style={{ textAlign: 'center', color: '#032cfc', marginBottom: '30px' }}>
                {steps[step].label}
            </h2>
            <input
                type={steps[step].field.includes('Password') ? 'password' : 'text'}
                value={formData[steps[step].field]}
                onChange={handleChange}
                placeholder={steps[step].placeholder}
                style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '20px',
                    borderRadius: '5px',
                    border: '1px solid #032cfc',
                    outline: 'none',
                    fontSize: '16px',
                }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button
                    onClick={handlePrevious}
                    disabled={step === 0}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: step === 0 ? '#cbd5e1' : '#032cfc',
                        color: '#fff',
                        cursor: step === 0 ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                    }}
                >
                    Previous
                </button>
                <button
                    onClick={handleNext}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '5px',
                        border: 'none',
                        backgroundColor: '#032cfc',
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '16px',
                    }}
                >
                    {step === steps.length - 1 ? 'Submit' : 'Next'}
                </button>
            </div>
        </div>
    );
}

export default SetupInstance;
