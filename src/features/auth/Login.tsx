import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from './authSlice';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiAlertCircle } from 'react-icons/fi';
import './Login.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      {/* Ambient background glows for Liquid Glass effect */}
      <div className="login-glow-bg login-glow-1" />
      <div className="login-glow-bg login-glow-2" />

      <div className="login-card">
        {/* Modern Dual-Tone Brand Logo Badge */}
        <div className="login-badge-wrapper">
          <div className="login-logo-badge" aria-label="Ecommerce Logo">
            <svg
              width="32"
              height="32"
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient
                  id="loginBrandSparkGrad"
                  x1="9"
                  y1="11"
                  x2="19"
                  y2="19"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#2563eb" />
                  <stop offset="1" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              {/* Modern Shopping Bag Form */}
              <rect x="4" y="8" width="20" height="16" rx="4.5" fill="#ffffff" />
              {/* Sleek Curved Handle */}
              <path
                d="M10 8V6C10 3.79086 11.7909 2 14 2C16.2091 2 18 3.79086 18 6V8"
                stroke="#ffffff"
                strokeLinecap="round"
                strokeWidth="1.2"
              />
              {/* Dynamic Center Retail Spark */}
              <path
                d="M14 11.5L14.9 14.1L17.5 15L14.9 15.9L14 18.5L13.1 15.9L10.5 15L13.1 14.1L14 11.5Z"
                fill="url(#loginBrandSparkGrad)"
              />
            </svg>
          </div>
        </div>

        {/* Brand Header */}
        <div className="login-brand-meta">
          <h1 className="login-brand-title">
            Ecommerce <span className="login-brand-badge">Admin</span>
          </h1>
          <p className="login-subtitle">
            Welcome back! Please sign in to your dashboard.
          </p>
        </div>

        {/* API Error Notification */}
        {apiError && (
          <div className="login-alert-error">
            <FiAlertCircle size={16} className="login-alert-icon" />
            <span>{apiError}</span>
          </div>
        )}

        <form className="login-form" onSubmit={handleLogin} noValidate>
          {/* Email Address */}
          <div className="login-input-group">
            <label htmlFor="login-email" className="login-label">
              Email Address
            </label>
            <div className={`login-input-wrapper ${emailError ? 'has-error' : ''}`}>
              <FiMail className="login-input-icon" size={17} />
              <input
                id="login-email"
                type="email"
                placeholder="admin@ecommerce.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                }}
                className="login-input"
                autoComplete="email"
                required
              />
            </div>
            {emailError && (
              <span className="login-error-text">
                <FiAlertCircle size={12} /> {emailError}
              </span>
            )}
          </div>

          {/* Password with Visibility Toggle */}
          <div className="login-input-group">
            <label htmlFor="login-password" className="login-label">
              Password
            </label>
            <div className={`login-input-wrapper ${passwordError ? 'has-error' : ''}`}>
              <FiLock className="login-input-icon" size={17} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                className="login-input login-input-password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff size={17} /> : <FiEye size={17} />}
              </button>
            </div>
            {passwordError && (
              <span className="login-error-text">
                <FiAlertCircle size={12} /> {passwordError}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
              <>
                <span className="login-spinner" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <FiLogIn size={16} />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
