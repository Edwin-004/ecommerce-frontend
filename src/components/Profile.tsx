import { BackButton } from './common/BackButton';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { type RootState } from '../store';
import { logout } from '../features/auth/authSlice';
import api from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import styles from './Profile.module.css';
import {
  FiUser,
  FiLock,
  FiSave,
  FiCheckCircle,
  FiAlertCircle,
  FiLogOut,
  FiEye,
  FiEyeOff,
  FiCamera,
} from 'react-icons/fi';

export const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { username, email, role } = useSelector(
    (state: RootState) => state.auth
  );

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Password visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Avatar Photo State
  const avatarKey = email ? `avatar_url_${email.toLowerCase()}` : 'avatar_url_default';
  const [avatarUrl, setAvatarUrl] = useState<string | null>(() => localStorage.getItem(avatarKey));

  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const isSuperAdmin = email && email.toLowerCase() === 'admin@ecommerce.com';
  const firstLetter = username ? username.charAt(0).toUpperCase() : (email ? email.charAt(0).toUpperCase() : 'U');

  const formatRole = (roleStr: string | null) => {
    if (isSuperAdmin) return '👑 Super Administrator';
    if (roleStr === 'ADMIN') return 'System Administrator';
    if (roleStr === 'INVENTORY_STAFF') return 'Inventory / Warehouse Staff';
    if (roleStr === 'SALES_STAFF' || roleStr === 'ORDER_STAFF') return 'Order / Sales Staff';
    return roleStr || 'Staff';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.warning('Image size should be less than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setAvatarUrl(base64String);
      localStorage.setItem(avatarKey, base64String);
      toast.success('Profile photo updated successfully.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl(null);
    localStorage.removeItem(avatarKey);
    toast.info('Profile photo removed.');
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Backend logout failed:', err);
    } finally {
      dispatch(logout());
      toast.success('Logged out successfully.');
      navigate('/login', { replace: true });
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
      toast.success('Password changed successfully.');
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

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <BackButton fallbackUrl="/admin/dashboard" />
          <div className={styles.titleArea}>
            <h1>
              <FiUser /> My Profile
            </h1>
            <p>View your personal profile details and security settings</p>
          </div>
        </div>
      </div>

      <div className={styles.profileCard}>
        {/* Profile Avatar Header */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarContainer}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="User Avatar" className={styles.avatarImg} />
            ) : (
              <div className={styles.avatarInitial}>{firstLetter}</div>
            )}
            <label
              htmlFor="profile-avatar-upload"
              className={styles.uploadBadgeBtn}
              title="Upload profile photo"
            >
              <FiCamera size={13} />
            </label>
            <input
              type="file"
              id="profile-avatar-upload"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleAvatarUpload}
            />
          </div>

          <div className={styles.avatarMeta}>
            <h2 className={styles.avatarName}>{username || 'User Profile'}</h2>
            <p className={styles.avatarEmail}>{email || 'No email registered'}</p>
            <span className={styles.roleBadge}>{formatRole(role)}</span>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className={styles.removeAvatarBtn}
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Account Name:</span>
          <span className={styles.value}>{username}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Email Address:</span>
          <span className={styles.value}>{email || 'Not provided'}</span>
        </div>

        <div className={styles.infoRow}>
          <span className={styles.label}>Role Status:</span>
          <span className={styles.value} style={{ fontWeight: '600' }}>
            {formatRole(role)}
          </span>
        </div>

        <hr className={styles.divider} />

        {/* Change Password Section */}
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
          {/* Current Password Field */}
          <div className={styles.formGroup}>
            <label>Current Password *</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showCurrent ? 'text' : 'password'}
                name="currentPassword"
                placeholder="Enter current password"
                value={passwords.currentPassword}
                onChange={handleInputChange}
                required
                className={styles.inputField}
                autoComplete="current-password"
              />
              <button
                type="button"
                className={styles.eyeToggleBtn}
                onClick={() => setShowCurrent((p) => !p)}
                title={showCurrent ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showCurrent ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password Field */}
          <div className={styles.formGroup}>
            <label>New Password * (Min 6 characters)</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showNew ? 'text' : 'password'}
                name="newPassword"
                placeholder="Enter new secret password"
                value={passwords.newPassword}
                onChange={handleInputChange}
                required
                className={styles.inputField}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeToggleBtn}
                onClick={() => setShowNew((p) => !p)}
                title={showNew ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showNew ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Password Field */}
          <div className={styles.formGroup}>
            <label>Confirm New Password *</label>
            <div className={styles.passwordInputWrapper}>
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm new secret password"
                value={passwords.confirmPassword}
                onChange={handleInputChange}
                required
                className={styles.inputField}
                autoComplete="new-password"
              />
              <button
                type="button"
                className={styles.eyeToggleBtn}
                onClick={() => setShowConfirm((p) => !p)}
                title={showConfirm ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showConfirm ? <FiEyeOff size={16} /> : <FiEye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{ marginTop: '12px' }}
          >
            <FiSave size={16} />
            {loading ? 'Updating Password...' : 'Update Password'}
          </button>
        </form>

        {/* Account Session Actions */}
        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '13.5px', color: '#1e293b' }}>Active Session</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>Terminate your current login session across all browsers.</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <FiLogOut size={14} />
            <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
