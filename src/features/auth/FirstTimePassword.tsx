import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout } from './authSlice';
import { type RootState } from '../../store';
import api from '../../utils/axiosConfig';
import { validatePasswordStrength } from '../../utils/passwordPolicy';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiLogOut, FiShield, FiAlertCircle } from 'react-icons/fi';
import './FirstTimePassword.css';

export const FirstTimePassword: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { username, email } = useSelector((state: RootState) => state.auth);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Field-specific Custom Error States
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const [loading, setLoading] = useState(false);

  // Real-time 5-Point Password Policy Criteria
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const isDifferentFromCurrent = currentPassword.length > 0 && newPassword.length > 0 && newPassword !== currentPassword;
  const isMatching = confirmPassword.length > 0 && newPassword === confirmPassword;


  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset all errors before validation
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');

    let hasError = false;

    // 1. Current Password Validation
    if (!currentPassword.trim()) {
      setCurrentPasswordError('Please enter your current (temporary) password.');
      hasError = true;
    }

    // 2. New Password Validation
    if (!newPassword.trim()) {
      setNewPasswordError('New secret password is required.');
      hasError = true;
    } else {
      const passwordPolicyError = validatePasswordStrength(newPassword.trim());
      if (passwordPolicyError) {
        setNewPasswordError(passwordPolicyError);
        hasError = true;
      } else if (newPassword === currentPassword) {
        setNewPasswordError('New password must be different from your temporary password.');
        hasError = true;
      }
    }

    // 3. Confirm Password Validation
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('Please confirm your new password.');
      hasError = true;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Confirm password does not match new password.');
      hasError = true;
    }

    if (hasError) {
      return;
    }

    setLoading(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
      });

      toast.success('Your secret password has been set successfully! Please log in with your new password.', { autoClose: 6000 });
      
      // Clear temporary session and redirect to login
      dispatch(logout());
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error('Password change error:', err);
      const serverMsg = err.response?.data?.message || 'Failed to update password. Please check your credentials.';

      // Map server response to specific field if possible
      if (serverMsg.toLowerCase().includes('current password') || serverMsg.toLowerCase().includes('incorrect')) {
        setCurrentPasswordError(serverMsg);
      } else {
        setGeneralError(serverMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="first-time-container">
      <div className="first-time-glow first-time-glow-1" />
      <div className="first-time-glow first-time-glow-2" />

      <div className="first-time-card">
        <div className="first-time-icon-box">
          <FiShield />
        </div>

        <h2 className="first-time-title">Set Your Secret Password</h2>
        <p className="first-time-subtitle">
          Welcome <strong>{username || email || 'Staff Member'}</strong>! For security protection, please replace your temporary administrator-issued password with your own secure secret password.
        </p>

        {generalError ? (
          <div className="first-time-alert first-time-alert-error">
            <FiAlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{generalError}</span>
          </div>
        ) : (
          <div className="first-time-alert first-time-alert-info">
            <FiShield size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>Once your secret password is set, you will be redirected to sign in with your permanent credentials.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="first-time-form" noValidate>
          {/* Current Password Field */}
          <div className="first-time-input-group">
            <label className="first-time-label">Current (Temporary) Password *</label>
            <div className={`first-time-input-wrapper ${currentPasswordError ? 'has-error' : ''}`}>
              <FiLock className="first-time-input-icon" size={16} />
              <input
                type={showCurrent ? 'text' : 'password'}
                className="first-time-input"
                placeholder="Enter temporary password"
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  if (currentPasswordError) setCurrentPasswordError('');
                  if (generalError) setGeneralError('');
                }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="first-time-pw-toggle"
                onClick={() => setShowCurrent((p) => !p)}
                aria-label={showCurrent ? 'Hide current password' : 'Show current password'}
                tabIndex={-1}
              >
                {showCurrent ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {currentPasswordError && (
              <span className="first-time-error-text">
                <FiAlertCircle size={13} /> {currentPasswordError}
              </span>
            )}
          </div>

          {/* New Password Field */}
          <div className="first-time-input-group">
            <label className="first-time-label">New Secret Password *</label>
            <div className={`first-time-input-wrapper ${newPasswordError ? 'has-error' : ''}`}>
              <FiLock className="first-time-input-icon" size={16} />
              <input
                type={showNew ? 'text' : 'password'}
                className="first-time-input"
                placeholder="Enter new secret password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (newPasswordError) setNewPasswordError('');
                  if (generalError) setGeneralError('');
                }}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="first-time-pw-toggle"
                onClick={() => setShowNew((p) => !p)}
                aria-label={showNew ? 'Hide new password' : 'Show new password'}
                tabIndex={-1}
              >
                {showNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {newPasswordError && (
              <span className="first-time-error-text">
                <FiAlertCircle size={13} /> {newPasswordError}
              </span>
            )}

            {/* Live Password Criteria Checklist Box */}
            <div className="first-time-rules-list">
              <span style={{ fontSize: '11.5px', fontWeight: '700', color: '#475569', marginBottom: '2px', display: 'block' }}>
                Password Requirements:
              </span>
              <div className={`first-time-rule-item ${hasMinLength ? 'valid' : ''}`}>
                {hasMinLength ? <FiCheck size={13} /> : <span className="first-time-req-dot" />}
                <span>At least 8 characters long</span>
              </div>
              <div className={`first-time-rule-item ${hasUppercase ? 'valid' : ''}`}>
                {hasUppercase ? <FiCheck size={13} /> : <span className="first-time-req-dot" />}
                <span>At least one uppercase letter (A-Z)</span>
              </div>
              <div className={`first-time-rule-item ${hasLowercase ? 'valid' : ''}`}>
                {hasLowercase ? <FiCheck size={13} /> : <span className="first-time-req-dot" />}
                <span>At least one lowercase letter (a-z)</span>
              </div>
              <div className={`first-time-rule-item ${hasNumber ? 'valid' : ''}`}>
                {hasNumber ? <FiCheck size={13} /> : <span className="first-time-req-dot" />}
                <span>At least one number (0-9)</span>
              </div>
              <div className={`first-time-rule-item ${hasSpecial ? 'valid' : ''}`}>
                {hasSpecial ? <FiCheck size={13} /> : <span className="first-time-req-dot" />}
                <span>At least one special character (!@#$%^&*)</span>
              </div>
              <div className={`first-time-rule-item ${isDifferentFromCurrent ? 'valid' : ''}`}>
                {isDifferentFromCurrent ? <FiCheck size={13} /> : <span className="first-time-req-dot" />}
                <span>Different from temporary password</span>
              </div>
            </div>
          </div>

          {/* Confirm New Password Field */}
          <div className="first-time-input-group">
            <label className="first-time-label">Confirm New Password *</label>
            <div className={`first-time-input-wrapper ${confirmPasswordError ? 'has-error' : ''}`}>
              <FiLock className="first-time-input-icon" size={16} />
              <input
                type={showConfirm ? 'text' : 'password'}
                className="first-time-input"
                placeholder="Confirm secret new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError('');
                  if (generalError) setGeneralError('');
                }}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="first-time-pw-toggle"
                onClick={() => setShowConfirm((p) => !p)}
                aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                tabIndex={-1}
              >
                {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
            {confirmPasswordError ? (
              <span className="first-time-error-text">
                <FiAlertCircle size={13} /> {confirmPasswordError}
              </span>
            ) : confirmPassword.length > 0 ? (
              isMatching ? (
                <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                  <FiCheck size={13} /> Passwords match
                </span>
              ) : (
                <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                  <FiAlertCircle size={13} /> Passwords do not match
                </span>
              )
            ) : null}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="first-time-btn-submit"
            disabled={loading}
          >
            {loading ? (
              'Updating Password...'
            ) : (
              <>
                <FiCheck size={16} /> Set Password &amp; Continue
              </>
            )}
          </button>
        </form>

        {/* Footer Logout Action */}
        <div className="first-time-footer-action">
          <button
            type="button"
            className="first-time-btn-logout"
            onClick={handleLogout}
          >
            <FiLogOut size={14} /> Log out and return to sign in
          </button>
        </div>
      </div>
    </div>
  );
};

export default FirstTimePassword;
