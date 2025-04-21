// src/components/SetupInstance.js
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiArrowLeft } from 'react-icons/fi';

const steps = [
  { label: 'Customer Name', name: 'customerName', type: 'text' },
  { label: 'Admin Password', name: 'adminPassword', type: 'password' },
  { label: 'Contact Email', name: 'contactEmail', type: 'email' },
  { label: 'Domain', name: 'domain', type: 'text' },
];

export default function SetupInstance() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState({
    customerName: '', adminPassword: '', contactEmail: '', domain: ''
  });
  const nav = useNavigate();

  const handleChange = e => {
    setData(d => ({ ...d, [e.target.name]: e.target.value }));
  };

  const next = () => setPage(p => Math.min(p + 1, steps.length - 1));
  const prev = () => setPage(p => Math.max(p - 1, 0));

  const setup = () => {
    axios.post('http://localhost:8080/api/setupInstance', data)
      .then(res => {
        if (res.data.message === 'Instance is Setup') {
          nav('/login');
        }
      });
  };

  const { label, name, type } = steps[page];

  return (
    <div className="container">
      <h1>Setup Instance</h1>
      <label>{label}</label>
      <input
        type={type}
        name={name}
        value={data[name]}
        onChange={handleChange}
      />
      <div className="wizard-step">
        <button
          className="btn-secondary"
          onClick={prev}
          disabled={page === 0}
        >
          <FiArrowLeft /> Previous
        </button>

        {page < steps.length - 1 ? (
          <button className="btn-primary" onClick={next}>
            Next <FiArrowRight />
          </button>
        ) : (
          <button className="btn-primary" onClick={setup}>
            Setup
          </button>
        )}
      </div>
    </div>
  );
}
