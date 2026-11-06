import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { setCredentials } from './authSlice';
import api from '../../utils/axiosConfig';
import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiLogIn,
  FiAlertCircle,
} from 'react-icons/fi';
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
      let data: any;
      try {
        const response = await api.post('/auth/login', {
          email: emailTrimmed,
          password,
        });
        data = response.data;
      } catch (err: any) {
        const errorData = err.response?.data;
        if (errorData) {
          if (errorData.blocked) {
            setGeneralError(errorData.message);
            setPasswordError(errorData.message);
            toast.error(errorData.message, { autoClose: 7000 });
          } else if (errorData.field === 'email') {
            setEmailError(errorData.message || 'Email not registered.');
          } else if (errorData.field === 'password') {
            setPasswordError(errorData.message || 'Incorrect password.');
          } else {
            setGeneralError(errorData.message || 'Login failed. Please try again.');
          }
          return;
        }
        throw err;
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
        toast.info('Please set your new password before accessing the system.');
        navigate('/admin/force-change-password');
      } else if (
        ['ADMIN', 'INVENTORY_STAFF', 'SALES_STAFF', 'ORDER_STAFF'].includes(
          data.role
        )
      ) {
        const redirectUrl = searchParams.get('redirect');
        navigate(redirectUrl || '/admin/dashboard');
      } else {
        setGeneralError('Unauthorized account access.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setGeneralError(
        'Cannot connect to server. Please ensure the backend is running.'
      );
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
          <div
            className="login-logo-badge"
            aria-label="Ecommerce Logo"
            style={{ background: 'transparent', padding: 0 }}
          >
            <img
              src="/logo.png"
              alt="Brand Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '50%',
              }}
            />
          </div>
        </div>

        {/* Brand Header */}
        <div className="login-brand-meta">
          <h1 className="login-brand-title">
            {/* Ecommerce <span className="login-brand-badge">Admin</span> */}
            Inventory Management System
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
            <div
              className={`login-input-wrapper ${emailError ? 'has-error' : ''}`}
            >
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
            <div
              className={`login-input-wrapper ${passwordError ? 'has-error' : ''}`}
            >
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
