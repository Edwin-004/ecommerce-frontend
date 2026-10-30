import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from './authSlice';
import { FiShoppingBag, FiLogIn } from 'react-icons/fi';
import './Login.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // States for Validation Errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [apiError, setApiError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // --- Frontend Validation ---
  const validateForm = () => {
    let isValid = true;
    setEmailError('');
    setPasswordError('');
    setApiError('');

    // Email Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required.');
      isValid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Invalid email format.');
      isValid = false;
    }

    // Password Validation
    if (!password) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      isValid = false;
    } else if (!/(?=.*[a-z])/.test(password)) {
      setPasswordError('Password must contain at least one lowercase letter (a-z).');
      isValid = false;
    } else if (!/(?=.*[A-Z])/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter (A-Z).');
      isValid = false;
    }

    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check Frontend Validation first. Do not call API if validation fails.
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/backoffice/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        // If Backend returns 400 Bad Request due to @Valid
        throw new Error('Login failed');
      }

      const data = await response.json();

      dispatch(
        setCredentials({
          token: data.token,
          username: data.username,
          email: data.email,
          role: data.role,
          permissions: data.permissions || [],
        })
      );

      if (['ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF', 'ORDER_STAFF'].includes(data.role)) {
        navigate('/admin/dashboard');
      } else {
        setApiError('Unauthorized account access.');
      }
    } catch (error) {
      setApiError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Brand Badge */}
        <div className="login-badge-wrapper">
          <div className="login-logo-badge">
            <FiShoppingBag size={24} />
          </div>
        </div>

        {/* E-commerce နှင့် လိုက်ဖက်သော ခေါင်းစဉ် */}
        <div className="login-logo">
          Ecommerce <span>Admin Portal</span>
        </div>
        <p className="login-subtitle">
          Welcome back! Please sign in to your dashboard.
        </p>

        {apiError && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '15px',
              fontSize: '14px',
              textAlign: 'center',
            }}
          >
            {apiError}
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-group">
            <label>Email Address</label>
            <input
              type="text"
              placeholder="admin@ecommerce.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ borderColor: emailError ? '#dc2626' : '' }}
            />
            {emailError && (
              <span
                style={{
                  color: '#dc2626',
                  fontSize: '12px',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                {emailError}
              </span>
            )}
          </div>

          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ borderColor: passwordError ? '#dc2626' : '' }}
            />
            {passwordError && (
              <span
                style={{
                  color: '#dc2626',
                  fontSize: '12px',
                  marginTop: '4px',
                  display: 'block',
                }}
              >
                {passwordError}
              </span>
            )}
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            <FiLogIn size={16} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};