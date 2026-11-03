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
    const [initialRoleName, setInitialRoleName] = useState('SALES_STAFF');
    const [showRoleConfirmModal, setShowRoleConfirmModal] = useState(false);
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

    const getRoleBadgeLabel = (role: string) => {
        const r = role?.toUpperCase();
        if (r === 'ADMIN') return 'Administrator (Full System Access)';
        if (r === 'INVENTORY_STAFF') return 'Inventory Staff (Stock & Products)';
        if (r === 'SALES_STAFF' || r === 'ORDER_STAFF') return 'Order / Sales Staff (Orders & Refunds)';
        return role;
    };

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
                setInitialRoleName(response.data.roleName);
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

        const isRoleChanging = formData.roleName !== initialRoleName;

        // If a non-SuperAdmin attempts to change role
        if (isRoleChanging && !isCurrentSuperAdmin) {
            toast.error("Only the primary Super Administrator has the authority to change or reassign account roles.");
            return;
        }

        // If role is changing, prompt Super Admin with a security confirmation modal
        if (isRoleChanging && !showRoleConfirmModal) {
            setShowRoleConfirmModal(true);
            return;
        }

        await executeSave();
    };

    const executeSave = async () => {
        setSubmitting(true);
        setShowRoleConfirmModal(false);
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

            toast.success('Account details updated successfully.');
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
                            disabled={!isCurrentSuperAdmin || isEditingRestricted || isCurrentLoggedInUser || isTargetSuperAdmin}
                        >
                            {/* ADMIN option is available only to Super Admin or if account already has ADMIN */}
                            {(isCurrentSuperAdmin || formData.roleName === 'ADMIN') && (
                                <option value="ADMIN">ADMIN (System Administrator)</option>
                            )}
                            <option value="INVENTORY_STAFF">INVENTORY STAFF (Manage Stock & Products)</option>
                            <option value="SALES_STAFF">ORDER / SALES STAFF (Manage Orders, Shipping & Refunds)</option>
                        </select>
                        {!isCurrentSuperAdmin ? (
                            <small style={{ 
                                color: '#92400e', 
                                backgroundColor: '#fef3c7', 
                                border: '1px solid #fde68a', 
                                padding: '6px 10px', 
                                borderRadius: '6px', 
                                fontSize: '12px', 
                                marginTop: '6px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px' 
                            }}>
                                🔒 <strong>Super Administrator Privilege:</strong> Only the primary Super Administrator has the authority to change or reassign account roles.
                            </small>
                        ) : isTargetSuperAdmin ? (
                            <small style={{ color: '#6b7280', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                                The primary Super Administrator role cannot be demoted.
                            </small>
                        ) : isCurrentLoggedInUser ? (
                            <small style={{ color: '#6b7280', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                                Administrator role cannot be demoted for your own active account.
                            </small>
                        ) : (
                            <small style={{ color: '#15803d', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                                🛡️ <em>As Super Administrator, changing this role will require a security confirmation dialog upon saving.</em>
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

            {/* Role Change Confirmation Modal */}
            {showRoleConfirmModal && (
                <div className="role-confirm-overlay" onClick={() => setShowRoleConfirmModal(false)}>
                    <div className="role-confirm-card" onClick={(e) => e.stopPropagation()}>
                        <div className="role-confirm-header">
                            <span className="role-confirm-badge">⚠️ Security Authorization</span>
                            <h3 className="role-confirm-title">Confirm Role Reassignment</h3>
                        </div>

                        <p className="role-confirm-text">
                            You are about to reassign the system role for account <strong>{formData.userName}</strong> (<em>{formData.email}</em>):
                        </p>

                        <div className="role-confirm-flow">
                            <div className="role-flow-box role-flow-old">
                                <span className="role-flow-label">Previous Role</span>
                                <span className="role-flow-val">{getRoleBadgeLabel(initialRoleName)}</span>
                            </div>
                            <div className="role-flow-arrow">➔</div>
                            <div className="role-flow-box role-flow-new">
                                <span className="role-flow-label">New Assigned Role</span>
                                <span className="role-flow-val">{getRoleBadgeLabel(formData.roleName)}</span>
                            </div>
                        </div>

                        <div className="role-confirm-notice">
                            🛡️ <strong>Security & Session Impact:</strong>
                            <ul style={{ margin: '6px 0 0 16px', padding: 0, fontSize: '12.5px' }}>
                                <li>Their system permissions will be adjusted immediately upon save.</li>
                                <li>Their active login session tokens will be invalidated, requiring them to sign in again with their newly assigned permissions.</li>
                            </ul>
                        </div>

                        <div className="role-confirm-actions">
                            <button
                                type="button"
                                className="btn-confirm-cancel"
                                onClick={() => setShowRoleConfirmModal(false)}
                                disabled={submitting}
                            >
                                Cancel & Review
                            </button>
                            <button
                                type="button"
                                className="btn-confirm-proceed"
                                onClick={executeSave}
                                disabled={submitting}
                            >
                                {submitting ? 'Applying Change...' : 'Yes, Confirm Role Change'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
