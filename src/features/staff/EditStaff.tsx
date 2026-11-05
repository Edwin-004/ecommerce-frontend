import React, { useState, useEffect } from 'react';
import { BackButton } from '../../components/common/BackButton';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiInfo } from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import { validatePasswordStrength } from '../../utils/passwordPolicy';
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
    
    const [showPassword, setShowPassword] = useState(false);
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

    const defaultRolePassword = formData.roleName === 'ADMIN' ? 'Admin@123' : 'Staff@123';

    const handleApplyDefaultPassword = () => {
        setFormData(prev => ({ ...prev, password: defaultRolePassword }));
    };

    const handleClearPassword = () => {
        setFormData(prev => ({ ...prev, password: '' }));
    };

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

        // Validate password strength if a new password is being set
        if (!isTargetSuperAdmin && formData.password && formData.password.trim()) {
            const passwordError = validatePasswordStrength(formData.password.trim());
            if (passwordError) {
                toast.warning(passwordError);
                return;
            }
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

            const isPasswordUpdated = !isTargetSuperAdmin && Boolean(formData.password && formData.password.trim());

            // Only send password if admin entered one (and not for super admin)
            if (isPasswordUpdated) {
                updatePayload.password = formData.password.trim();
            }

            await api.put(`/staff/${id}`, updatePayload);

            // 2. If status was changed, update via dedicated status endpoint
            if (formData.status !== initialStatus) {
                await api.put(`/staff/${id}/status`, null, {
                    params: { status: formData.status }
                });
            }

            if (isPasswordUpdated) {
                toast.success(`Staff updated successfully. New temporary password: "${formData.password.trim()}". Staff will be required to change password on next login.`, { autoClose: 6000 });
            } else {
                toast.success('Account details updated successfully.');
            }
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                    <BackButton fallbackUrl="/admin/staff" />
                    <div>
                        <h2 className="edit-staff-title" style={{ margin: 0 }}>Edit Staff Member</h2>
                        <p className="edit-staff-subtitle" style={{ margin: 0 }}>Update information for staff ID: {id}</p>
                    </div>
                </div>

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

                    {/* Reset Password is only for subordinate staff members. Super Admin manages password via Profile > Change Password */}
                    {!isTargetSuperAdmin ? (
                        <div className="form-group">
                            <label>Reset Password (Optional)</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={isEditingRestricted}
                                    placeholder={isEditingRestricted ? "Password modification restricted" : "Leave blank to keep current password"}
                                    autoComplete="new-password"
                                    style={{ paddingRight: '40px', width: '100%' }}
                                />
                                {!isEditingRestricted && (
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        style={{
                                            position: 'absolute',
                                            right: '12px',
                                            background: 'none',
                                            border: 'none',
                                            color: '#64748b',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '16px'
                                        }}
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? <FiEyeOff /> : <FiEye />}
                                    </button>
                                )}
                            </div>

                            {!isEditingRestricted && (
                                <>
                                    {/* Option 2 Helper Bar */}
                                    <div style={{ 
                                        marginTop: '7px', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between', 
                                        fontSize: '12px', 
                                        color: '#475569' 
                                    }}>
                                        <span>Default: <strong style={{ color: '#2563eb' }}>{defaultRolePassword}</strong></span>
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            {formData.password !== defaultRolePassword && (
                                                <button
                                                    type="button"
                                                    onClick={handleApplyDefaultPassword}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#2563eb',
                                                        cursor: 'pointer',
                                                        padding: 0,
                                                        fontWeight: 500,
                                                        fontSize: '11.5px',
                                                        textDecoration: 'underline'
                                                    }}
                                                >
                                                    Use Default ({defaultRolePassword})
                                                </button>
                                            )}
                                            {formData.password && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearPassword}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#dc2626',
                                                        cursor: 'pointer',
                                                        padding: 0,
                                                        fontWeight: 500,
                                                        fontSize: '11.5px',
                                                        textDecoration: 'underline'
                                                    }}
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <small style={{ color: '#6b7280', fontSize: '11.5px', marginTop: '5px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <FiInfo size={13} style={{ flexShrink: 0 }} />
                                        {formData.password.trim() ? (
                                            <span>
                                                Staff member will be forced to create their own secret password upon next login with this temporary password.
                                            </span>
                                        ) : (
                                            <span>Leave blank to keep their current password unchanged.</span>
                                        )}
                                    </small>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="form-group">
                            <label>Password Management</label>
                            <div style={{
                                padding: '10px 14px',
                                backgroundColor: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '13px',
                                color: '#475569'
                            }}>
                                🔒 <strong>Super Administrator Security:</strong> The primary Super Administrator's password cannot be reset from this staff management form. Please use the <strong>Profile &gt; Change Password</strong> settings to update your password securely.
                            </div>
                        </div>
                    )}

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

export default EditStaff;
