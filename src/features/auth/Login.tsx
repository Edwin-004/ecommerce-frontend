import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setCredentials } from './authSlice';
import { FiMail, FiLock, FiEye, FiEyeOff, FiLogIn, FiAlertCircle } from 'react-icons/fi';
import './Login.css';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Field-specific Error States
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Listen for session expiry / kick-out messages from axios interceptor
  useEffect(() => {
    const expiredMsg = sessionStorage.getItem('auth_expired_message');
    if (expiredMsg) {
      sessionStorage.removeItem('auth_expired_message');
      setGeneralError(expiredMsg);
      toast.warning(expiredMsg, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset previous errors
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    let hasClientError = false;

    // Email validation
    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed) {
      setEmailError('Email is required.');
      hasClientError = true;
    } else if (!emailRegex.test(emailTrimmed)) {
      setEmailError('Invalid email format.');
      hasClientError = true;
    }

    // Password validation
    if (!password) {
      setPasswordError('Password is required.');
      hasClientError = true;
    }

    // If there is any client-side error, do not call API
    if (hasClientError) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:8080/api/backoffice/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailTrimmed, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.blocked) {
          setGeneralError(data.message);
          setPasswordError(data.message);
          toast.error(data.message, { autoClose: 7000 });
        } else if (data.field === 'email') {
          setEmailError(data.message || 'Email not registered.');
        } else if (data.field === 'password') {
          setPasswordError(data.message || 'Incorrect password.');
        } else {
          setGeneralError(data.message || 'Login failed. Please try again.');
        }
        return;
      }

      dispatch(
        setCredentials({
          token: data.token,
          username: data.username,
          email: data.email,
          role: data.role,
          permissions: data.permissions || [],
          mustChangePassword: data.mustChangePassword,
        })
      );

      // First-time login / Force password change check
      if (data.mustChangePassword) {
        toast.info("Please set your new password before accessing the system.");
        navigate('/admin/force-change-password');
      } else if (['ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF', 'ORDER_STAFF'].includes(data.role)) {
        const redirectUrl = searchParams.get('redirect');
        navigate(redirectUrl || '/admin/dashboard');
      } else {
        setGeneralError('Unauthorized account access.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setGeneralError('Cannot connect to server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Background ambient decorative glows */}
      <div className="login-glow-bg login-glow-1" />
      <div className="login-glow-bg login-glow-2" />

      <div className="login-card">
        {/* Brand Icon Badge */}
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
              <rect x="4" y="8" width="20" height="16" rx="4.5" fill="#ffffff" />
              <path
                d="M10 8V6C10 3.79086 11.7909 2 14 2C16.2091 2 18 3.79086 18 6V8"
                stroke="#ffffff"
                strokeLinecap="round"
                strokeWidth="1.2"
              />
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
            Welcome back! Please sign in to your account.
          </p>
        </div>

        {/* General Error (Server down, unauthorized, or session expired) */}
        {generalError && (
          <div className="login-alert-error">
            <FiAlertCircle size={16} className="login-alert-icon" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Login Form */}
        <form className="login-form" onSubmit={handleLogin} noValidate>
          {/* Email Field */}
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
                  if (generalError) setGeneralError('');
                }}
                className="login-input"
                autoComplete="email"
              />
            </div>
            {emailError && (
              <span className="login-error-text">
                <FiAlertCircle size={13} /> {emailError}
              </span>
            )}
          </div>

          {/* Password Field */}
          <div className="login-input-group">
            <label htmlFor="login-password" className="login-label">
              Password
            </label>
            <div className={`login-input-wrapper ${passwordError ? 'has-error' : ''}`}>
              <FiLock className="login-input-icon" size={17} />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError('');
                  if (generalError) setGeneralError('');
                }}
                className="login-input login-input-password"
                autoComplete="current-password"
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
                <FiAlertCircle size={13} /> {passwordError}
              </span>
            )}
          </div>

          {/* Sign In Button */}
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