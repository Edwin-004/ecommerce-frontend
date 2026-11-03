import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig';
import './EditStaff.css';

export const EditStaff: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const currentEmail = localStorage.getItem('email');
    const isCurrentSuperAdmin = Boolean(currentEmail && currentEmail.toLowerCase() === 'admin@ecommerce.com');

    const [formData, setFormData] = useState({
        userName: '',
        email: '',
        roleName: 'SALES_STAFF',
        status: 'ACTIVE',
        password: '' // Optional password reset field
    });
    
    const [initialStatus, setInitialStatus] = useState('ACTIVE');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const isCurrentLoggedInUser = Boolean(
        currentEmail && formData.email && currentEmail.toLowerCase() === formData.email.toLowerCase()
    );

    const isTargetSuperAdmin = Boolean(
        formData.email && formData.email.toLowerCase() === 'admin@ecommerce.com'
    );

    const isTargetAdmin = formData.roleName === 'ADMIN';

    // Subordinate admins cannot edit Super Admin or fellow Admins
    const isEditingRestricted = (!isCurrentSuperAdmin && !isCurrentLoggedInUser && isTargetAdmin) || 
                                (isTargetSuperAdmin && !isCurrentSuperAdmin);

    useEffect(() => {
        const fetchStaffDetails = async () => {
            try {
                // Fetch existing staff details from backend
                const response = await api.get(`/staff/${id}`); 
                setFormData({
                    userName: response.data.userName,
                    email: response.data.email,
                    roleName: response.data.roleName,
                    status: response.data.status,
                    password: ''
                });
                setInitialStatus(response.data.status);
                setLoading(false);
            } catch (err: any) {
                console.error("Error fetching staff:", err);
                const errorMsg = err.response?.data?.message || "Failed to load staff details. Please try again.";
                setError(errorMsg);
                setLoading(false);
            }
        };

        if (id) {
            fetchStaffDetails();
        }
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditingRestricted) {
            toast.error("You do not have permission to modify this administrator account.");
            return;
        }

        setSubmitting(true);
        try {
            // 1. Update basic information (Name, Email, Role, and optional Password)
            const updatePayload: any = {
                userName: formData.userName,
                email: formData.email,
                roleName: formData.roleName === 'ORDER_STAFF' ? 'SALES_STAFF' : formData.roleName
            };

            // Only send password if admin entered one
            if (formData.password && formData.password.trim()) {
                updatePayload.password = formData.password.trim();
            }

            await api.put(`/staff/${id}`, updatePayload);

            // 2. If status was changed, update via dedicated status endpoint
            if (formData.status !== initialStatus) {
                await api.put(`/staff/${id}/status`, null, {
                    params: { status: formData.status }
                });
            }

            toast.success('Staff details updated successfully.');
            navigate('/admin/staff');
        } catch (err: any) {
            console.error("Error updating staff:", err);
            const errorMsg = err.response?.data?.message || 'Failed to update staff details.';
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loading-text">Loading staff details...</div>;
    if (error) return <div className="error-text">{error}</div>;

    return (
        <div className="edit-staff-container">
            <div className="edit-staff-card">
                <h2 className="edit-staff-title">Edit Account</h2>
                <p className="edit-staff-subtitle">Update user and role information for ID: #{id}</p>

                {/* Banner: Restricted access for subordinate admins */}
                {isTargetSuperAdmin && !isCurrentSuperAdmin && (
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#991b1b',
                        fontSize: '13px',
                        marginBottom: '18px',
                        lineHeight: '1.5'
                    }}>
                        🛡️ <strong>Access Restricted:</strong> The primary Super Administrator account (<code>admin@ecommerce.com</code>) is protected and cannot be modified by subordinate administrators.
                    </div>
                )}

                {!isTargetSuperAdmin && isTargetAdmin && !isCurrentSuperAdmin && !isCurrentLoggedInUser && (
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '8px',
                        color: '#991b1b',
                        fontSize: '13px',
                        marginBottom: '18px',
                        lineHeight: '1.5'
                    }}>
                        🛡️ <strong>Access Restricted:</strong> Subordinate administrators cannot modify or reassign accounts belonging to fellow administrators. Only the Super Administrator has this authority.
                    </div>
                )}

                {/* Banner: Editing own logged-in account */}
                {isCurrentLoggedInUser && (
                    <div style={{
                        padding: '10px 14px',
                        backgroundColor: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        color: '#1e40af',
                        fontSize: '13px',
                        marginBottom: '18px'
                    }}>
                        ℹ️ <strong>You are editing your own account.</strong> Account deactivation and role demotion away from Administrator are restricted.
                    </div>
                )}

                <form onSubmit={handleSubmit} className="edit-staff-form">
                    <div className="form-group">
                        <label>Full Name *</label>
                        <input
                            type="text"
                            name="userName"
                            value={formData.userName}
                            onChange={handleChange}
                            required
                            disabled={isEditingRestricted}
                            placeholder="Enter full name"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address *</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={isEditingRestricted || isTargetSuperAdmin}
                            placeholder="Enter email address"
                        />
                        {isTargetSuperAdmin && (
                            <small style={{ color: '#6b7280', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                                The primary Super Administrator's root email address cannot be renamed.
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Role</label>
                        <select
                            name="roleName"
                            value={formData.roleName === 'ORDER_STAFF' ? 'SALES_STAFF' : formData.roleName}
                            onChange={handleChange}
                            disabled={isEditingRestricted || isCurrentLoggedInUser || isTargetSuperAdmin}
                        >
                            {/* ADMIN option is available only to Super Admin or if account already has ADMIN */}
                            {(isCurrentSuperAdmin || formData.roleName === 'ADMIN') && (
                                <option value="ADMIN">ADMIN (Administrator)</option>
                            )}
                            <option value="INVENTORY_STAFF">INVENTORY STAFF (Manage Stock & Products)</option>
                            <option value="SALES_STAFF">ORDER / SALES STAFF (Manage Orders, Shipping & Refunds)</option>
                        </select>
                        {isTargetSuperAdmin ? (
                            <small style={{ color: '#6b7280', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                                The primary Super Administrator role cannot be demoted.
                            </small>
                        ) : isCurrentLoggedInUser ? (
                            <small style={{ color: '#6b7280', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                                Administrator role cannot be demoted for your own active account.
                            </small>
                        ) : !isCurrentSuperAdmin && (
                            <small style={{ color: '#6b7280', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                                Only the Super Administrator can promote staff members to Administrator.
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Account Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            disabled={isEditingRestricted || isCurrentLoggedInUser || isTargetSuperAdmin}
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE" disabled={isCurrentLoggedInUser || isTargetSuperAdmin}>
                                Inactive (Suspended)
                            </option>
                        </select>
                        {isTargetSuperAdmin ? (
                            <small style={{ color: '#6b7280', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                                The Super Administrator account can never be deactivated or suspended.
                            </small>
                        ) : isCurrentLoggedInUser && (
                            <small style={{ color: '#6b7280', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                                You cannot deactivate or suspend your own logged-in account.
                            </small>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Reset Password (Optional)</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            disabled={isEditingRestricted}
                            placeholder={isEditingRestricted ? "Password modification restricted" : "Leave blank to keep current password"}
                            autoComplete="new-password"
                        />
                        <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                            {isEditingRestricted 
                                ? "Password reset is restricted for this administrator."
                                : "Only enter a new password if you want to reset this staff member's password. They will be required to change it on their next login."}
                        </small>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/admin/staff')}>
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn-save" 
                            disabled={submitting || isEditingRestricted}
                            style={isEditingRestricted ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                            {submitting ? 'Saving Changes...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
