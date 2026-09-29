// src/features/auth/Login.tsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from './authSlice';
import './Login.css'; // <--- ခုနက ရေးထားသော CSS ဖိုင်ကို ချိတ်ဆက်ခြင်း

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:8080/api/backoffice/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) throw new Error('Login failed');

      const data = await response.json();
      
      // Email ကိုပါ Redux ထဲ သိမ်းပေးမည် (ယခင်အဆင့်က ပြင်ထားသည့်အတိုင်း)
      dispatch(setCredentials({ 
          token: data.token, 
          username: data.username, 
          email: data.email,
          role: data.role 
      }));
      
      if (data.role === 'ADMIN' || data.role === 'INVENTORY_STAFF' || data.role === 'SALES_STAFF') {
          navigate('/admin/dashboard');
      } else {
          alert('ဝင်ခွင့်မရှိသော အကောင့်ဖြစ်ပါသည်။');
          navigate('/login');
      }
    } catch (error) {
      alert('Email သို့မဟုတ် Password မှားယွင်းနေပါသည်။');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* E-commerce နှင့် လိုက်ဖက်သော ခေါင်းစဉ် */}
        <div className="login-logo">E-Commerce <span>Portal</span></div>
        <p className="login-subtitle">Welcome back! Please login to your account.</p>
        
        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email Address</label>
            <input 
              type="email" 
              placeholder="admin@ecommerce.com" 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          
          <div className="input-group">
            <label>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>
          
          <button type="submit" className="login-btn">Sign In</button>
        </form>
      </div>
    </div>
  );
};