// src/components/Login.js
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [creds, setCreds] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const nav = useNavigate();

  const handleChange = e =>
    setCreds(c => ({ ...c, [e.target.name]: e.target.value }));

  const login = () => {
    axios.post('http://localhost:8080/api/loginUser', creds)
      .then(res => {
        if (res.data.message === 'Success') {
          document.cookie = `auth_token=${res.data.cookie_token};path=/;max-age=${60*60*24}`;
          nav('/dashboard');
        } else {
          setError('Login failed');
        }
      });
  };

  return (
    <div className="container">
      <h1>Login to NalFlo</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="text"
        name="username"
        placeholder="Username"
        value={creds.username}
        onChange={handleChange}
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={creds.password}
        onChange={handleChange}
      />
      <button className="btn-primary" onClick={login}>
        Login
      </button>
    </div>
  );
}
