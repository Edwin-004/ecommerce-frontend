import { BackButton } from '../../components/common/BackButton';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';
import './CreateStaff.css'; 

export const CreateStaff: React.FC = () => {
    const navigate = useNavigate();
    const currentEmail = localStorage.getItem('email');
    const isSuperAdmin = Boolean(currentEmail && currentEmail.toLowerCase() === 'admin@ecommerce.com');

    const [newStaff, setNewStaff] = useState({
        userName: '',
        email: '',
        password: '',
        roleName: 'INVENTORY_STAFF' 
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await api.post('/staff', newStaff);
            toast.success("Staff account created successfully.");
            navigate('/admin/staff'); 
        } catch (err: any) {
            console.error("Error creating staff:", err);
            const errorMsg = err.response?.data?.message || "An error occurred while creating the staff account.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-staff-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 20px', position: 'relative' }}>
            
            <div style={{ width: '100%', maxWidth: '600px' }}>
                
                <div className="create-staff-header" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                    <BackButton fallbackUrl="/admin/staff" />
                    <div>
                        <h2 className="header-title">Create New Account</h2>
                        <p className="header-subtitle">Add a new administrator or staff member to the system</p>
                    </div>
                </div>

                <div className="form-card">
                    <form className="staff-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Full Name *</label>
                            <input 
                                type="text" 
                                className="form-input" 
                                required 
                                placeholder="Enter staff full name"
                                value={newStaff.userName} 
                                onChange={e => setNewStaff({...newStaff, userName: e.target.value})} 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Email Address *</label>
                            <input 
                                type="email" 
                                className="form-input" 
                                required 
                                placeholder="staff@ecommerce.com"
                                value={newStaff.email} 
                                onChange={e => setNewStaff({...newStaff, email: e.target.value})} 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Initial Temporary Password *</label>
                            <input 
                                type="password" 
                                className="form-input" 
                                required 
                                placeholder="Create staff initial temporary password"
                                value={newStaff.password} 
                                onChange={e => setNewStaff({...newStaff, password: e.target.value})} 
                            />
                            <small style={{ color: '#64748b', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                                🔒 <em>Staff member will be prompted to set their own secret password upon their first login.</em>
                            </small>
                        </div>
                        
                        <div className="form-group">
                            <label>Assign Role *</label>
                            <select 
                                className="form-select"
                                value={newStaff.roleName} 
                                onChange={e => setNewStaff({...newStaff, roleName: e.target.value})}
                            >
                                {isSuperAdmin && (
                                    <option value="ADMIN">ADMIN (System Administrator)</option>
                                )}
                                <option value="INVENTORY_STAFF">INVENTORY STAFF (Manage Stock & Products)</option>
                                <option value="SALES_STAFF">ORDER / SALES STAFF (Manage Orders, Shipping & Refunds)</option>
                            </select>
                            {!isSuperAdmin && (
                                <small style={{ color: '#64748b', fontSize: '11.5px', marginTop: '5px', display: 'block' }}>
                                    🛡️ <em>Only the primary Super Administrator (admin@ecommerce.com) can create new Administrator accounts.</em>
                                </small>
                            )}
                        </div>
                        
                        <hr className="divider" />
                        
                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => navigate('/admin/staff')}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Create Account'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
};
