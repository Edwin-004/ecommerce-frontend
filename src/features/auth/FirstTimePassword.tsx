import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { logout } from './authSlice';
import { type RootState } from '../../store';
import api from '../../utils/axiosConfig';
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

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
    setErrorMsg('');

    if (!currentPassword) {
      setErrorMsg('Please enter your current (temporary) password.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMsg('New password must be different from your current temporary password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirm password do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      toast.success('Password set successfully! Please log in with your new password.');
      
      // Clear temporary session and redirect to login
      dispatch(logout());
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error('Password change error:', err);
      const serverMsg = err.response?.data?.message || 'Failed to update password. Please check your credentials.';
      setErrorMsg(serverMsg);
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
          Hello <strong>{username || email || 'Staff'}</strong>! For security reasons, you must change your initial temporary password before continuing.
        </p>

        {errorMsg ? (
          <div className="first-time-alert first-time-alert-error">
            <FiAlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="first-time-alert first-time-alert-info">
            <FiShield size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>After setting your new password, you will be redirected to sign in with your chosen credentials.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="first-time-form">
          {/* Current Password */}
          <div className="first-time-input-group">
            <label className="first-time-label">Current (Temporary) Password *</label>
            <div className="first-time-input-wrapper">
              <FiLock className="first-time-input-icon" size={16} />
              <input
                type={showCurrent ? 'text' : 'password'}
                className="first-time-input"
                placeholder="Enter temporary password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="first-time-pw-toggle"
                onClick={() => setShowCurrent((p) => !p)}
                tabIndex={-1}
              >
                {showCurrent ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="first-time-input-group">
            <label className="first-time-label">New Password * (Min 6 characters)</label>
            <div className="first-time-input-wrapper">
              <FiLock className="first-time-input-icon" size={16} />
              <input
                type={showNew ? 'text' : 'password'}
                className="first-time-input"
                placeholder="Enter secret new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="first-time-pw-toggle"
                onClick={() => setShowNew((p) => !p)}
                tabIndex={-1}
              >
                {showNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div className="first-time-input-group">
            <label className="first-time-label">Confirm New Password *</label>
            <div className="first-time-input-wrapper">
              <FiLock className="first-time-input-icon" size={16} />
              <input
                type={showConfirm ? 'text' : 'password'}
                className="first-time-input"
                placeholder="Confirm secret new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
              />
              <button
                type="button"
                className="first-time-pw-toggle"
                onClick={() => setShowConfirm((p) => !p)}
                tabIndex={-1}
              >
                {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="first-time-btn-submit"
            disabled={loading}
          >
            {loading ? (
              'Updating Password...'
            ) : (
              <>
                <FiCheck size={16} /> Set Password & Continue
              </>
            )}
          </button>
        </form>

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
