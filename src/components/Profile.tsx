import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { type RootState } from '../store';
import api from '../utils/axiosConfig';

export const Profile = () => {
  // Redux မှ username နှင့် role အပြင် email ကိုပါ ရယူခြင်း
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
      setMessage({ type: 'error', text: 'Password အသစ်နှင့် Confirm Password မတူညီပါ။' });
      return;
    }

    setLoading(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });

      setMessage({ type: 'success', text: 'Password အောင်မြင်စွာ ပြောင်းလဲပြီးပါပြီ။' });
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Password ပြောင်းလဲရာတွင် အမှားအယွင်းဖြစ်နေပါသည်။' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>My Profile</h2>
      <div style={{ background: '#f9f9f9', padding: '20px', marginTop: '20px', border: '1px solid #ddd', borderRadius: '4px', maxWidth: '500px' }}>
        
        <p><strong>Name:</strong> {username}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Role:</strong> <span style={{ color: '#008CBA', fontWeight: 'bold' }}>{formatRole(role)}</span></p>
        
        <hr style={{ margin: '20px 0', border: '0', borderTop: '1px solid #ccc' }} />
        
        {/* Admin မဟုတ်တဲ့သူ (Staff တွေ) ဝင်လာမှသာ Change Password ကို ပြမည် */}
        {role !== 'ADMIN' && (
          <>
            <h3>Change Password</h3>
            
            {message && (
              <div style={{ padding: '10px', marginBottom: '15px', color: 'white', background: message.type === 'success' ? '#4CAF50' : '#f44336', borderRadius: '4px' }}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label>Current Password:</label><br />
                <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label>New Password:</label><br />
                <input type="password" name="newPassword" value={passwords.newPassword} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label>Confirm New Password:</label><br />
                <input type="password" name="confirmPassword" value={passwords.confirmPassword} onChange={handleInputChange} required style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} />
              </div>

              <button type="submit" disabled={loading} style={{ padding: '10px 15px', background: '#008CBA', color: 'white', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', borderRadius: '4px', marginTop: '10px', width: 'fit-content' }}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </>
        )}

        {/* Admin ဝင်လာပါက Password ပြင်လို့မရကြောင်း စာသားပြပေးမည် */}
        {role === 'ADMIN' && (
          <div style={{ padding: '15px', background: '#e7f3fe', color: '#3182ce', borderRadius: '4px', textAlign: 'center' }}>
            Admin အကောင့်များအတွက် Password ပြင်ဆင်ခြင်းကို ဤနေရာမှ ခွင့်မပြုပါ။
          </div>
        )}

      </div>
    </div>
  );
};