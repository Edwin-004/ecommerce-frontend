import { BackButton } from '../../components/common/BackButton';
import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../store';
import { FiEye, FiEyeOff, FiUserPlus, FiShield, FiInfo, FiCheck } from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import { validatePasswordStrength } from '../../utils/passwordPolicy';
import './CreateStaff.css'; 

export const CreateStaff: React.FC = () => {
    const navigate = useNavigate();
    const currentUser = useSelector((state: RootState) => state.auth);
    const isSuperAdmin = currentUser?.email === 'admin@ecommerce.com';

    // Option 2: Default password initialized as 'Staff@123' (or 'Admin@123') with custom edit support
    const [searchParams] = useSearchParams();
    const queryRole = searchParams.get('role')?.toUpperCase();
    const initialRole = (queryRole === 'ADMIN' || queryRole === 'INVENTORY_STAFF' || queryRole === 'SALES_STAFF' || queryRole === 'ORDER_STAFF') ? queryRole : 'INVENTORY_STAFF';

    const [newStaff, setNewStaff] = useState({
        userName: '',
        email: '',
        password: initialRole === 'ADMIN' ? 'Admin@123' : 'Staff@123',
        roleName: initialRole 
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    // Custom Modal State
    const [modalConfig, setModalConfig] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({ 
        show: false, 
        message: '', 
        type: 'success' 
    });

    const showModal = (message: string, type: 'success' | 'error' | 'warning') => {
        setModalConfig({ show: true, message, type });
    };

    const handleModalClose = () => {
        setModalConfig({ ...modalConfig, show: false });
        if (modalConfig.type === 'success') {
            navigate('/admin/staff'); 
        }
    };

    const getDefaultPasswordForRole = (role: string) => {
        return role === 'ADMIN' ? 'Admin@123' : 'Staff@123';
    };

    const handleRoleChange = (selectedRole: string) => {
        const isDefaultPassword = 
            newStaff.password === 'Staff@123' || 
            newStaff.password === 'Admin@123' || 
            newStaff.password.trim() === '';
        
        const nextDefault = getDefaultPasswordForRole(selectedRole);

        setNewStaff(prev => ({
            ...prev,
            roleName: selectedRole,
            // If the admin hasn't customized the password, automatically align it with the selected role
            password: isDefaultPassword ? nextDefault : prev.password
        }));
    };

    const handleResetToDefaultPassword = () => {
        const defaultPwd = getDefaultPasswordForRole(newStaff.roleName);
        setNewStaff(prev => ({ ...prev, password: defaultPwd }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const trimmedEmail = newStaff.email.trim().toLowerCase();
        const trimmedUserName = newStaff.userName.trim();
        const trimmedPassword = newStaff.password.trim();

        if (!trimmedUserName) {
            showModal("Please enter full name.", 'warning');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
            showModal("Please enter a valid email address.", 'warning');
            return;
        }

        if (newStaff.roleName === 'ADMIN' && !isSuperAdmin) {
            showModal("Only Super Administrator (admin@ecommerce.com) can create Administrator accounts.", 'warning');
            return;
        }

        // Validate password strength against backend complexity policy
        const passwordError = validatePasswordStrength(trimmedPassword);
        if (passwordError) {
            showModal(passwordError, 'warning');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                userName: trimmedUserName,
                email: trimmedEmail,
                roleName: newStaff.roleName,
                password: trimmedPassword
            };
            await api.post('/staff', payload);
            showModal(
                `Account created successfully for "${trimmedUserName}". Initial password: "${trimmedPassword}". The user will be required to create their own secret password upon first login.`,
                'success'
            );
        } catch (err: any) {
            console.error("Error creating staff:", err);
            const errDetail = err.response?.data?.message || "An error occurred while creating the account.";
            showModal(errDetail, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Real-time password criteria
    const pw = newStaff.password || '';
    const hasMinLength = pw.length >= 8;
    const hasUppercase = /[A-Z]/.test(pw);
    const hasLowercase = /[a-z]/.test(pw);
    const hasNumber = /[0-9]/.test(pw);
    const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw);

    const currentRoleDefault = getDefaultPasswordForRole(newStaff.roleName);

    return (
        <div className="create-staff-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px', position: 'relative' }}>
            
            <div style={{ width: '100%', maxWidth: '600px' }}>
                
                <div className="create-staff-header" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                    <BackButton fallbackUrl="/admin/staff" />
                    <div>
                        <h2 className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FiUserPlus /> Create New Account
                        </h2>
                        <p className="header-subtitle">Add a new administrator or back-office staff member</p>
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
                                placeholder="e.g. John Doe"
                                value={newStaff.userName} 
                                onChange={e => setNewStaff({...newStaff, userName: e.target.value})} 
                                onBlur={() => setNewStaff(prev => ({ ...prev, userName: prev.userName.trim() }))}
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Email Address *</label>
                            <input 
                                type="email" 
                                className="form-input" 
                                required 
                                placeholder="e.g. staff@ecommerce.com"
                                value={newStaff.email} 
                                onChange={e => setNewStaff({...newStaff, email: e.target.value.toLowerCase().replace(/\s+/g, '')})} 
                                onBlur={() => setNewStaff(prev => ({ ...prev, email: prev.email.trim().toLowerCase() }))}
                            />
                        </div>

                        <div className="form-group">
                            <label>Assign Role *</label>
                            <select 
                                className="form-select"
                                value={newStaff.roleName} 
                                onChange={e => handleRoleChange(e.target.value)}
                            >
                                {isSuperAdmin && (
                                    <option value="ADMIN">🛡️ System Administrator (Full Access)</option>
                                )}
                                <option value="INVENTORY_STAFF">📦 Inventory Staff (Stock & Products)</option>
                                <option value="SALES_STAFF">🛍️ Order / Sales Staff (Orders & Shipments)</option>
                            </select>
                            {!isSuperAdmin && (
                                <p style={{ margin: '6px 0 0 0', fontSize: '11.5px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <FiShield size={12} color="#f59e0b" />
                                    Administrator roles can only be granted by Super Administrator.
                                </p>
                            )}
                        </div>
                        
                        <div className="form-group">
                            <label>Initial Temporary Password *</label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <input 
                                    type={showPassword ? 'text' : 'password'} 
                                    className="form-input" 
                                    required 
                                    placeholder="Enter initial password"
                                    value={newStaff.password} 
                                    onChange={e => setNewStaff({...newStaff, password: e.target.value})} 
                                    style={{ paddingRight: '40px' }}
                                />
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
                            </div>

                            {/* Option 2 Helper Bar */}
                            <div style={{ 
                                marginTop: '7px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyItems: 'center',
                                justifyContent: 'space-between', 
                                fontSize: '12px', 
                                color: '#475569' 
                            }}>
                                <span>Default: <strong style={{ color: '#2563eb' }}>{currentRoleDefault}</strong></span>
                                {newStaff.password !== currentRoleDefault && (
                                    <button
                                        type="button"
                                        onClick={handleResetToDefaultPassword}
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
                                        Reset to Default
                                    </button>
                                )}
                            </div>
                            <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FiInfo size={12} />
                                Staff member will be forced to set their own secret password upon first login.
                            </p>

                            {/* Real-time Password Requirements Checklist */}
                            <div className="pw-requirements-box">
                                <span className="pw-requirements-header">Password Requirements:</span>
                                <div className={`pw-req-item ${hasMinLength ? 'valid' : ''}`}>
                                    {hasMinLength ? <FiCheck size={13} /> : <span className="pw-req-dot" />}
                                    <span>At least 8 characters long</span>
                                </div>
                                <div className={`pw-req-item ${hasUppercase ? 'valid' : ''}`}>
                                    {hasUppercase ? <FiCheck size={13} /> : <span className="pw-req-dot" />}
                                    <span>At least one uppercase letter (A-Z)</span>
                                </div>
                                <div className={`pw-req-item ${hasLowercase ? 'valid' : ''}`}>
                                    {hasLowercase ? <FiCheck size={13} /> : <span className="pw-req-dot" />}
                                    <span>At least one lowercase letter (a-z)</span>
                                </div>
                                <div className={`pw-req-item ${hasNumber ? 'valid' : ''}`}>
                                    {hasNumber ? <FiCheck size={13} /> : <span className="pw-req-dot" />}
                                    <span>At least one number (0-9)</span>
                                </div>
                                <div className={`pw-req-item ${hasSpecial ? 'valid' : ''}`}>
                                    {hasSpecial ? <FiCheck size={13} /> : <span className="pw-req-dot" />}
                                    <span>At least one special character (!@#$%^&*)</span>
                                </div>
                            </div>
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

            {/* Custom Modal Box */}
            {modalConfig.show && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(15, 23, 42, 0.4)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '28px',
                        borderRadius: '14px',
                        width: '380px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
                        textAlign: 'center'
                    }}>
                        <div style={{ 
                            fontSize: '42px', 
                            marginBottom: '12px', 
                            lineHeight: 1
                        }}>
                            {modalConfig.type === 'success' ? '✅' : modalConfig.type === 'warning' ? '⚠️' : '❌'}
                        </div>
                        <h3 style={{ marginBottom: '10px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                            {modalConfig.type === 'success' ? 'Success' : modalConfig.type === 'warning' ? 'Notice' : 'Error'}
                        </h3>
                        <p style={{ marginBottom: '22px', color: '#475569', fontSize: '14px', lineHeight: '1.5' }}>
                            {modalConfig.message}
                        </p>
                        <button 
                            type="button"
                            onClick={handleModalClose}
                            style={{
                                padding: '9px 24px',
                                backgroundColor: modalConfig.type === 'success' ? '#2563eb' : '#334155',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13.5px'
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreateStaff;
