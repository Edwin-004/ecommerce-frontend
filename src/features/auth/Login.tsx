import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from './authSlice';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      
      // Redux နှင့် LocalStorage ထဲသို့ Token ထည့်သွင်းခြင်း
      dispatch(setCredentials({ token: data.token, username: data.username, role: data.role }));
      
      // Admin ဆိုလျှင် Dashboard သို့ ပို့ပေးမည်
      if(data.role === 'ADMIN') {
         navigate('/admin/dashboard');
      } else {
         navigate('/');
      }
    } catch (error) {
      alert('Email သို့မဟုတ် Password မှားယွင်းနေပါသည်။');
    }
  };

  return (
    <div>
      <h2>Login System</h2>
      <form onSubmit={handleLogin}>
        <input type="email" placeholder="Email" onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} required />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};