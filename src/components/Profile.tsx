import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../store';
import api from '../utils/axiosConfig';
import styles from './Profile.module.css';

export const Profile = () => {
  const { username, email, role } = useSelector((state: RootState) => state.auth);

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const formatRole = (roleStr: string | null) => {
    if (roleStr === 'ADMIN') return 'System Admin';
    if (roleStr === 'INVENTORY_STAFF') return 'Inventory Staff';
    if (roleStr === 'SALES_STAFF') return 'Sales Staff';
    return roleStr || 'Unknown Role';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswords({ ...passwords, [e.target.name]: e.target.value });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (passwords.newPassword !== passwords.confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      setMessage({ type: 'success', text: 'Password updated successfully.' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update password. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>My Profile</h2>
      
      <div className={styles.profileCard}>
        <div className={styles.infoRow}>
          <span className={styles.label}>Name:</span>
          <span className={styles.value}>{username}</span>
        </div>
        
        <div className={styles.infoRow}>
          <span className={styles.label}>Email:</span>
          <span className={styles.value}>{email || 'Not provided'}</span>
        </div>
        
        <div className={styles.infoRow}>
          <span className={styles.label}>Role:</span>
          <span className={styles.roleBadge}>{formatRole(role)}</span>
        </div>
        
        <hr className={styles.divider} />
        
        {role !== 'ADMIN' && (
          <>
            <h3 className={styles.sectionTitle}>Change Password</h3>
            
            {message && (
              <div className={`${styles.alert} ${message.type === 'success' ? styles.alertSuccess : styles.alertError}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className={styles.formGroup}>
                <label>Current Password</label>
                <input 
                  type="password" 
                  name="currentPassword" 
                  value={passwords.currentPassword} 
                  onChange={handleInputChange} 
                  required 
                  className={styles.inputField}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>New Password</label>
                <input 
                  type="password" 
                  name="newPassword" 
                  value={passwords.newPassword} 
                  onChange={handleInputChange} 
                  required 
                  className={styles.inputField}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  name="confirmPassword" 
                  value={passwords.confirmPassword} 
                  onChange={handleInputChange} 
                  required 
                  className={styles.inputField}
                />
              </div>

              <button type="submit" disabled={loading} className={styles.submitBtn}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </>
        )}

        {role === 'ADMIN' && (
          <div className={`${styles.alert} ${styles.alertInfo}`}>
            Password modification for Admin accounts is restricted in this portal.
          </div>
        )}
      </div>
    </div>
  );
};