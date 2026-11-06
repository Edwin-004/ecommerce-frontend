import React, { useState, useEffect } from 'react';
import { BackButton } from '../../components/common/BackButton';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiEye, FiEyeOff, FiInfo, FiCheck } from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import { validatePasswordStrength } from '../../utils/passwordPolicy';
import './EditStaff.css';

export const EditStaff: React.FC = () => {
    const { id: pathId } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id') || pathId;
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
    const [initialEmail, setInitialEmail] = useState('');
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

    // Real-time password reset criteria
    const resetPw = formData.password || '';
    const hasResetMinLength = resetPw.length >= 8;
    const hasResetUppercase = /[A-Z]/.test(resetPw);
    const hasResetLowercase = /[a-z]/.test(resetPw);
    const hasResetNumber = /[0-9]/.test(resetPw);
    const hasResetSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(resetPw);

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
                const data = response.data;

                const isTargetSuper = Boolean(
                    data.email && data.email.toLowerCase() === 'admin@ecommerce.com'
                );

                if (isTargetSuper && !isCurrentSuperAdmin) {
                    setError("ACCESS_DENIED_SUPER_ADMIN");
                    setLoading(false);
                    return;
                }

                setFormData({
                    userName: data.userName,
                    email: data.email,
                    roleName: data.roleName,
                    status: data.status,
                    password: ''
                });
                setInitialStatus(data.status);
                setInitialRoleName(data.roleName);
                setInitialEmail(data.email || '');
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
    }, [id, isCurrentSuperAdmin]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'email') {
            setFormData(prev => ({ ...prev, email: value.toLowerCase().replace(/\s+/g, '') }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditingRestricted) {
            toast.error("You do not have permission to modify this administrator account.");
            return;
        }

        const trimmedEmail = formData.email.trim().toLowerCase();
        const trimmedUserName = formData.userName.trim();

        if (!trimmedUserName) {
            toast.warning("Full name cannot be blank.");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
            toast.warning("Please enter a valid email address.");
            return;
        }

        // Option 2 Protection: Subordinate admins cannot change email
        if (initialEmail && trimmedEmail !== initialEmail.trim().toLowerCase() && !isCurrentSuperAdmin) {
            toast.error("Only the primary Super Administrator has the authority to change account email addresses.");
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
            const trimmedEmail = formData.email.trim().toLowerCase();
            const trimmedUserName = formData.userName.trim();

            // 1. Update basic information (Name, Email, Role, and optional Password)
            const updatePayload: any = {
                userName: trimmedUserName,
                email: trimmedEmail,
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

    // Completely block and hide the edit form if target is Super Admin and logged-in user is not Super Admin
    if ((isTargetSuperAdmin && !isCurrentSuperAdmin) || error === "ACCESS_DENIED_SUPER_ADMIN" || (error && error.toLowerCase().includes('super administrator'))) {
        return (
            <div className="edit-staff-container">
                <div className="edit-staff-card" style={{ maxWidth: '520px', margin: '40px auto', textAlign: 'center', padding: '40px 28px' }}>
                    <div style={{
                        width: '68px',
                        height: '68px',
                        borderRadius: '50%',
                        backgroundColor: '#fef3c7',
                        border: '2px solid #fde68a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 18px',
                        fontSize: '30px'
                    }}>
                        🔒
                    </div>
                    
                    <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                        Access Restricted
                    </h2>
                    
                    <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, marginBottom: '24px' }}>
                        The <strong>Super Administrator</strong> account (<code style={{ color: '#b45309', fontWeight: 600 }}>admin@ecommerce.com</code>) cannot be viewed or modified by other staff or administrators. Only the root Super Administrator has access.
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate('/admin/staff')}
                        style={{
                            padding: '10px 24px',
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '13.5px',
                            cursor: 'pointer',
                            boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.2)'
                        }}
                    >
                        ← Back to Staff List
                    </button>
                </div>
            </div>
        );
    }

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
                            onBlur={() => setFormData(prev => ({ ...prev, userName: prev.userName.trim() }))}
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
                            onBlur={() => setFormData(prev => ({ ...prev, email: prev.email.trim().toLowerCase() }))}
                            required
                            disabled={!isCurrentSuperAdmin || isEditingRestricted || isTargetSuperAdmin}
                            placeholder="Enter email address"
                        />
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
                                🔒 <strong>Super Administrator Privilege:</strong> Staff email address modification is restricted to the primary Super Administrator only.
                            </small>
                        ) : isTargetSuperAdmin ? (
                            <small style={{ color: '#6b7280', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                                The primary Super Administrator's root email address cannot be renamed.
                            </small>
                        ) : (
                            <small style={{ color: '#15803d', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                                🛡️ <em>As Super Administrator, updating this email address will automatically revoke active sessions for this account.</em>
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
                            disabled={isEditingRestricted || isCurrentLoggedInUser || isTargetSuperAdmin || (isTargetAdmin && !isCurrentSuperAdmin)}
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE" disabled={isCurrentLoggedInUser || isTargetSuperAdmin || (isTargetAdmin && !isCurrentSuperAdmin)}>
                                Inactive (Suspended)
                            </option>
                        </select>
                        {isTargetSuperAdmin ? (
                            <small style={{ color: '#6b7280', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                                The primary Super Administrator account cannot be deactivated or suspended.
                            </small>
                        ) : (isTargetAdmin && !isCurrentSuperAdmin) ? (
                            <small style={{ color: '#6b7280', fontSize: '11.5px', marginTop: '4px', display: 'block' }}>
                                Only the primary Super Administrator can change the status of an Administrator.
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

                                    {/* Real-time Password Requirements Checklist (displayed when setting a new password) */}
                                    {resetPw.length > 0 && (
                                        <div className="pw-requirements-box">
                                            <span className="pw-requirements-header">Password Requirements:</span>
                                            <div className={`pw-req-item ${hasResetMinLength ? 'valid' : ''}`}>
                                                {hasResetMinLength ? <FiCheck size={13} /> : <span className="pw-req-dot" />}
                                                <span>At least 8 characters long</span>
                                            </div>
                                            <div className={`pw-req-item ${hasResetUppercase ? 'valid' : ''}`}>
                                                {hasResetUppercase ? <FiCheck size={13} /> : <span className="pw-req-dot" />}
                                                <span>At least one uppercase letter (A-Z)</span>
                                            </div>
                                            <div className={`pw-req-item ${hasResetLowercase ? 'valid' : ''}`}>
                                                {hasResetLowercase ? <FiCheck size={13} /> : <span className="pw-req-dot" />}
                                                <span>At least one lowercase letter (a-z)</span>
                                            </div>
                                            <div className={`pw-req-item ${hasResetNumber ? 'valid' : ''}`}>
                                                {hasResetNumber ? <FiCheck size={13} /> : <span className="pw-req-dot" />}
                                                <span>At least one number (0-9)</span>
                                            </div>
                                            <div className={`pw-req-item ${hasResetSpecial ? 'valid' : ''}`}>
                                                {hasResetSpecial ? <FiCheck size={13} /> : <span className="pw-req-dot" />}
                                                <span>At least one special character (!@#$%^&*)</span>
                                            </div>
                                        </div>
                                    )}
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
