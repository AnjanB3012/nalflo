// src/components/HomePage.js
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCookie } from '../utils/auth';

export default function HomePage() {
  const nav = useNavigate();

  useEffect(() => {
    if (getCookie('auth_token')) {
      nav('/dashboard');
    } else {
      axios.get('http://localhost:8080/api/homeCheck')
        .then(res => {
          const msg = res.data.message;
          if (msg === '0') nav('/setupInstance');
          else if (msg === '1') nav('/login');
        })
        .catch(() => console.error('homeCheck failed'));
    }
  }, [nav]);

  return null; 
}
