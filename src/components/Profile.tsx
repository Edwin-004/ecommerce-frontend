import { BackButton } from './common/BackButton';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../store';
import api from '../utils/axiosConfig';
import styles from './Profile.module.css';
import {
  FiLock,
  FiSave,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiEye,
  FiEyeOff,
  FiCamera,
} from 'react-icons/fi';

export const Profile = () => {
  const navigate = useNavigate();
  const { username, email, role } = useSelector(
    (state: RootState) => state.auth
  );

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => {
    return (
      localStorage.getItem(`avatar_${username?.toLowerCase()}`) ||
      localStorage.getItem(`avatar_${username}`) ||
      localStorage.getItem(`avatar_${email?.toLowerCase()}`) ||
      localStorage.getItem(`avatar_${email}`) ||
      localStorage.getItem('currentUserAvatar') ||
      null
    );
  });

  useEffect(() => {
    if (!avatarUrl) {
      const saved =
        localStorage.getItem(`avatar_${username?.toLowerCase()}`) ||
        localStorage.getItem(`avatar_${username}`) ||
        localStorage.getItem(`avatar_${email?.toLowerCase()}`) ||
        localStorage.getItem(`avatar_${email}`) ||
        localStorage.getItem('currentUserAvatar') ||
        null;
      if (saved) setAvatarUrl(saved);
    }
  }, [username, email, avatarUrl]);

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  // Keyboard shortcut: Pressing Escape (outside of inputs) navigates back safely
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && document.activeElement?.tagName !== 'INPUT') {
        if (window.history.state && window.history.state.idx > 0) {
          navigate(-1);
        } else {
          navigate('/admin/dashboard');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  const formatRole = (roleStr: string | null) => {
    if (roleStr === 'ADMIN') return 'System Admin';
    if (roleStr === 'INVENTORY_STAFF') return 'Inventory Staff';
    if (roleStr === 'SALES_STAFF' || roleStr === 'ORDER_STAFF') return 'Order / Sales Staff';
    return roleStr || 'Staff';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Image size should be less than 2MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarUrl(result);
        if (username) {
          localStorage.setItem(`avatar_${username}`, result);
          localStorage.setItem(`avatar_${username.toLowerCase()}`, result);
        }
        if (email) {
          localStorage.setItem(`avatar_${email}`, result);
          localStorage.setItem(`avatar_${email.toLowerCase()}`, result);
        }
        localStorage.setItem('currentUserAvatar', result);
        
        // Notify all components (Sidebar, All Accounts table, etc.)
        window.dispatchEvent(new Event('avatarChange'));
        setMessage({ type: 'success', text: 'Profile photo updated successfully!' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwords.newPassword.length < 6) {
      setMessage({
        type: 'error',
        text: 'New password must be at least 6 characters long.',
      });
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({
        type: 'error',
        text: 'New password and confirm password do not match.',
      });
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setPasswords({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setMessage({
        type: 'error',
        text:
          err.response?.data?.message ||
          'Failed to update password. Please check your current password.',
      });
    } finally {
      setLoading(false);
    }
  };

  const firstLetter = username ? username.charAt(0).toUpperCase() : 'U';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <BackButton fallbackUrl="/admin/dashboard" />
          <div className={styles.titleArea}>
            <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
              My Profile
            </h1>
            <p className="text-xs text-slate-500">View your personal profile details and security settings</p>
          </div>
        </div>
      </div>

      <div className={styles.profileCard}>
        {/* Avatar Section */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrapper}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarFallback}>{firstLetter}</div>
            )}
          </div>
          <label className={styles.avatarUploadLabel}>
            <FiCamera size={14} /> Change Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className={styles.hiddenFileInput}
            />
          </label>
        </div>

        {/* User Info Details */}
        <div className={styles.infoSection}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Full Name:</span>
            <span className={styles.value}>{username || 'Unknown'}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.label}>Email Address:</span>
            <span className={styles.value}>{email || 'Not provided'}</span>
          </div>

          <div className={styles.infoRow}>
            <span className={styles.label}>Account Role:</span>
            <span className={styles.roleBadge}>{formatRole(role)}</span>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* Password Management */}
        <h3 className={styles.sectionTitle}>
          <FiLock /> Change Password
        </h3>

        {message && (
          <div
            className={`${styles.alert} ${
              message.type === 'success'
                ? styles.alertSuccess
                : styles.alertError
            }`}
          >
            {message.type === 'success' ? (
              <FiCheckCircle size={16} />
            ) : (
              <FiAlertCircle size={16} />
            )}
            <span>{message.text}</span>
          </div>
        )}

        <form onSubmit={handleChangePassword}>
          <div className={styles.formGroup}>
            <label>Current Password *</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                name="currentPassword"
                placeholder="Enter current password"
                value={passwords.currentPassword}
                onChange={handleInputChange}
                required
                className={styles.inputField}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                aria-label="Toggle Current Password visibility"
              >
                {showCurrentPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>New Password *</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                name="newPassword"
                placeholder="Enter new password (min. 6 characters)"
                value={passwords.newPassword}
                onChange={handleInputChange}
                required
                className={styles.inputField}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowNewPassword(!showNewPassword)}
                aria-label="Toggle New Password visibility"
              >
                {showNewPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>Confirm New Password *</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm new password"
                value={passwords.confirmPassword}
                onChange={handleInputChange}
                required
                className={styles.inputField}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="Toggle Confirm Password visibility"
              >
                {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={styles.submitBtn}
          >
            <FiSave size={16} />
            {loading ? 'Updating Password...' : 'Save New Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
