import { BackButton } from '../../components/common/BackButton';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiSlash, FiCheck } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../utils/axiosConfig'; 
import './StaffList.css';

interface StaffResponseDTO {
    userId: number;
    userName: string;
    email: string;
    roleName: string;
    status: string;
    createdAt: string;
}

export const StaffList: React.FC = () => {
    const navigate = useNavigate();
    const [staffList, setStaffList] = useState<StaffResponseDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [selectedRole, setSelectedRole] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [showModal, setShowModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<{ id: number; name: string; status: string } | null>(null);

    // Current logged-in user email
    const currentEmail = localStorage.getItem('email');
    const isCurrentSuperAdmin = Boolean(currentEmail && currentEmail.toLowerCase() === 'admin@ecommerce.com');

    const fetchStaff = async () => {
        try {
            const response = await api.get('/staff');
            setStaffList(response.data);
            setLoading(false);
        } catch (err: any) {
            console.error("Error fetching staff data:", err);
            const errorMsg = err.response?.data?.message || "Failed to load staff list. Please try again.";
            setError(errorMsg);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery, selectedRole]);

    const filteredStaff = staffList.filter((staff) => {
        const matchesTab = activeTab === 'ALL' || staff.status === activeTab;
        const matchesRole =
            selectedRole === 'ALL' ||
            (selectedRole === 'SALES_STAFF'
                ? staff.roleName === 'SALES_STAFF' || staff.roleName === 'ORDER_STAFF'
                : staff.roleName === selectedRole);
        const matchesSearch = staff.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            staff.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesRole && matchesSearch;
    });

    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentStaffData = filteredStaff.slice(startIndex, startIndex + itemsPerPage);

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'badge-role-admin';
            case 'INVENTORY_STAFF': return 'badge-role-inventory';
            case 'SALES_STAFF':
            case 'ORDER_STAFF':
                return 'badge-role-sales';
            default: return 'badge-role-default';
        }
    };

    const formatRoleName = (role: string) => {
        if (role === 'SALES_STAFF' || role === 'ORDER_STAFF') return 'ORDER / SALES STAFF';
        if (role === 'INVENTORY_STAFF') return 'INVENTORY STAFF';
        return role.replace('_', ' ');
    };

    const formatDateDMY = (dateString?: string) => {
        if (!dateString) return '-';
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '-';
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const handleEdit = (id: number, _name?: string) => {
        navigate(`/admin/staff/edit/${id}`);
    };

    const openConfirmModal = (id: number, name: string, status: string) => {
        setSelectedStaff({ id, name, status });
        setShowModal(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedStaff) return;

        const { id, status } = selectedStaff;
        const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const actionVerb = status === 'ACTIVE' ? 'suspended' : 'activated';

        try {
            await api.put(`/staff/${id}/status`, null, {
                params: { status: newStatus }
            });

            setStaffList(prevList => prevList.map(staff => staff.userId === id ? { ...staff, status: newStatus } : staff));
            setShowModal(false);
            setSelectedStaff(null);
            toast.success(`Account ${actionVerb} successfully.`);
        } catch (err: any) {
            console.error(`Error updating account status:`, err);
            const errorMsg = err.response?.data?.message || `Failed to update account status.`;
            toast.error(errorMsg);
            setShowModal(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading user and staff data...</div>;
    if (error) return <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>{error}</div>;

    return (
        <div className="staff-container">
            <div className="header-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <BackButton fallbackUrl="/admin/dashboard" />
                    <div>
                        <h2 className="header-title">Staff &amp; Administrator Management</h2>
                        <p className="header-subtitle">Manage system administrators, staff accounts, roles, and account statuses</p>
                    </div>
                </div>
                <button className="btn-add" onClick={() => navigate('/admin/staff/new')}>
                    + Add New Account
                </button>
            </div>

            <div className="summary-cards">
                <div className="card">
                    <div className="icon-box icon-blue">👥</div>
                    <div>
                        <p className="card-value">{staffList.length}</p>
                        <p className="card-label">Total Accounts</p>
                    </div>
                </div>
                
                <div className="card">
                    <div className="icon-box icon-green">✅</div>
                    <div>
                        <p className="card-value">
                            {staffList.filter(s => s.status === 'ACTIVE').length}
                        </p>
                        <p className="card-label">Active Accounts</p>
                    </div>
                </div>

                <div className="card">
                    <div className="icon-box icon-purple">🛡️</div>
                    <div>
                        <p className="card-value">
                            {staffList.filter(s => s.roleName === 'ADMIN').length}
                        </p>
                        <p className="card-label">Administrators</p>
                    </div>
                </div>

                <div className="card">
                    <div className="icon-box icon-red">🚫</div>
                    <div>
                        <p className="card-value">
                            {staffList.filter(s => s.status !== 'ACTIVE').length}
                        </p>
                        <p className="card-label">Inactive Accounts</p>
                    </div>
                </div>
            </div>

            <div className="table-section">
                <div className="table-controls">
                    <div className="tabs">
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
                            onClick={() => setActiveTab('ALL')}
                        >
                            All Accounts
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
                            onClick={() => setActiveTab('ACTIVE')}
                        >
                            Active
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === 'INACTIVE' ? 'active' : ''}`}
                            onClick={() => setActiveTab('INACTIVE')}
                        >
                            Inactive
                        </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <select
                            className="search-input"
                            style={{ width: 'auto', minWidth: '170px', cursor: 'pointer', paddingRight: '8px' }}
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                        >
                            <option value="ALL">All Roles</option>
                            <option value="ADMIN">ADMIN</option>
                            <option value="INVENTORY_STAFF">INVENTORY STAFF</option>
                            <option value="SALES_STAFF">ORDER / SALES STAFF</option>
                        </select>
                        <input
                            type="text"
                            placeholder="🔍 Search users..."
                            className="search-input"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="staff-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentStaffData.length > 0 ? (
                                currentStaffData.map((staff) => {
                                    const isCurrentUser = Boolean(currentEmail && staff.email.toLowerCase() === currentEmail.toLowerCase());
                                    const isTargetSuperAdmin = staff.email.toLowerCase() === 'admin@ecommerce.com';
                                    const isTargetAdmin = staff.roleName === 'ADMIN';

                                    // Permission logic
                                    const canEdit = isCurrentSuperAdmin || isCurrentUser || !isTargetAdmin;
                                    const editDisabledReason = isTargetSuperAdmin && !isCurrentSuperAdmin
                                        ? "Super Administrator account cannot be modified by subordinate administrators"
                                        : isTargetAdmin && !isCurrentUser && !isCurrentSuperAdmin
                                        ? "Subordinate administrators cannot modify fellow administrators"
                                        : "";

                                    return (
                                        <tr key={staff.userId}>
                                            <td style={{ fontWeight: '500' }}>
                                                {staff.userName}
                                                {isCurrentUser && (
                                                    <span style={{ 
                                                        marginLeft: '8px', 
                                                        fontSize: '11px', 
                                                        padding: '2px 7px', 
                                                        borderRadius: '6px', 
                                                        backgroundColor: '#dbeafe', 
                                                        color: '#1d4ed8', 
                                                        fontWeight: '600' 
                                                    }}>
                                                        You
                                                    </span>
                                                )}
                                            </td>
                                            <td>{staff.email}</td>
                                            <td>
                                                {isTargetSuperAdmin ? (
                                                    <span 
                                                        className="staff-badge" 
                                                        style={{ 
                                                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', 
                                                            color: '#ffffff', 
                                                            boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            fontWeight: '600'
                                                        }}
                                                    >
                                                        👑 Super Admin
                                                    </span>
                                                ) : (
                                                    <span className={`staff-badge ${getRoleBadgeClass(staff.roleName)}`}>
                                                        {formatRoleName(staff.roleName)}
                                                    </span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`staff-badge ${staff.status === 'ACTIVE' ? 'badge-status-active' : 'badge-status-inactive'}`}>
                                                    {staff.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td>{formatDateDMY(staff.createdAt)}</td>
                                            <td>
                                                <div className="table-action-group">
                                                    {canEdit ? (
                                                        <button
                                                            type="button"
                                                            className="table-btn-edit"
                                                            onClick={() => handleEdit(staff.userId, staff.userName)}
                                                            title="Edit account details"
                                                        >
                                                            <FiEdit2 size={12} /> Edit
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="table-btn-edit"
                                                            disabled
                                                            style={{ opacity: 0.45, cursor: 'not-allowed' }}
                                                            title={editDisabledReason}
                                                        >
                                                            <FiEdit2 size={12} /> Edit
                                                        </button>
                                                    )}
                                                    
                                                    {isCurrentUser ? (
                                                        <span 
                                                            style={{ 
                                                                fontSize: '11px', 
                                                                color: '#9ca3af', 
                                                                padding: '4px 8px', 
                                                                borderRadius: '4px', 
                                                                backgroundColor: '#f3f4f6', 
                                                                cursor: 'not-allowed' 
                                                            }}
                                                            title="You cannot suspend your own logged-in account"
                                                        >
                                                            Current User
                                                        </span>
                                                    ) : isTargetSuperAdmin ? (
                                                        <span 
                                                            style={{ 
                                                                fontSize: '11px', 
                                                                color: '#9ca3af', 
                                                                padding: '4px 8px', 
                                                                borderRadius: '4px', 
                                                                backgroundColor: '#f3f4f6', 
                                                                cursor: 'not-allowed',
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '3px'
                                                            }}
                                                            title="Primary Super Administrator cannot be suspended or deactivated"
                                                        >
                                                            🛡️ Protected
                                                        </span>
                                                    ) : isTargetAdmin && !isCurrentSuperAdmin ? (
                                                        <span 
                                                            style={{ 
                                                                fontSize: '11px', 
                                                                color: '#9ca3af', 
                                                                padding: '4px 8px', 
                                                                borderRadius: '4px', 
                                                                backgroundColor: '#f3f4f6', 
                                                                cursor: 'not-allowed' 
                                                            }}
                                                            title="Only the Super Administrator can suspend an administrator"
                                                        >
                                                            Admin Only
                                                        </span>
                                                    ) : staff.status === 'ACTIVE' ? (
                                                        <button
                                                            type="button"
                                                            className="table-btn-delete"
                                                            onClick={() => openConfirmModal(staff.userId, staff.userName, staff.status)}
                                                            title="Suspend account"
                                                        >
                                                            <FiSlash size={12} /> Suspend
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="table-btn-activate"
                                                            onClick={() => openConfirmModal(staff.userId, staff.userName, staff.status)}
                                                            title="Activate account"
                                                        >
                                                            <FiCheck size={12} /> Activate
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                                        No accounts found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pagination-container">
                    <span className="pagination-info">
                        Showing {filteredStaff.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStaff.length)} of {filteredStaff.length} Entries
                    </span>
                    <div className="pagination-controls">
                        <button 
                            type="button"
                            className="page-btn page-btn-nav" 
                            disabled={currentPage === 1} 
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        >
                            Previous
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button 
                                type="button"
                                key={page} 
                                className={`page-btn page-btn-num ${currentPage === page ? 'active' : ''}`}
                                onClick={() => setCurrentPage(page)}
                            >
                                {page}
                            </button>
                        ))}

                        <button 
                            type="button"
                            className="page-btn page-btn-nav" 
                            disabled={currentPage === totalPages} 
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Confirmation Modal Box */}
            {showModal && selectedStaff && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    backdropFilter: 'blur(2px)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '28px 24px',
                        borderRadius: '12px',
                        width: '100%',
                        maxWidth: '420px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ marginBottom: '10px', fontSize: '18px', fontWeight: '700', color: '#111827' }}>
                            Confirm Account Action
                        </h3>
                        <p style={{ marginBottom: '24px', color: '#4b5563', fontSize: '14px', lineHeight: '1.5' }}>
                            Are you sure you want to <b>{selectedStaff.status === 'ACTIVE' ? 'suspend' : 'activate'}</b> the account for <b>"{selectedStaff.name}"</b>?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                            <button 
                                type="button"
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '9px 20px',
                                    backgroundColor: '#f3f4f6',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13.5px'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={handleConfirmAction}
                                style={{
                                    padding: '9px 22px',
                                    backgroundColor: selectedStaff.status === 'ACTIVE' ? '#dc2626' : '#16a34a',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13.5px'
                                }}
                            >
                                Confirm
                            </button>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};
