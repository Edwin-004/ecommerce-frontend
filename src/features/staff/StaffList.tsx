import { BackButton } from '../../components/common/BackButton';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../store';
import { FiEdit2, FiSlash, FiCheck, FiFilter, FiShield, FiUser } from 'react-icons/fi';
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
    const currentUser = useSelector((state: RootState) => state.auth);
    const isCurrentSuperAdmin = currentUser?.email?.toLowerCase() === 'admin@ecommerce.com';

    const [staffList, setStaffList] = useState<StaffResponseDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [searchParams, setSearchParams] = useSearchParams();

    const paramTab = (searchParams.get('tab') as 'ALL' | 'ACTIVE' | 'INACTIVE') || 'ALL';
    const paramRole = searchParams.get('role') || 'ALL';
    const paramSearch = searchParams.get('search') || '';
    const paramPage = Number(searchParams.get('page')) || 1;

    const [activeTab, setActiveTabState] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>(paramTab);
    const [selectedRole, setSelectedRoleState] = useState<string>(paramRole);
    const [searchQuery, setSearchQueryState] = useState(paramSearch);
    const [currentPage, setCurrentPageState] = useState(paramPage);

    const updateQueryParams = (updates: { tab?: string; role?: string; search?: string; page?: number }) => {
        const next = new URLSearchParams(searchParams);
        const nextTab = updates.tab !== undefined ? updates.tab : activeTab;
        const nextRole = updates.role !== undefined ? updates.role : selectedRole;
        const nextSearch = updates.search !== undefined ? updates.search : searchQuery;
        const nextPage = updates.page !== undefined ? updates.page : 1;

        if (nextTab && nextTab !== 'ALL') next.set('tab', nextTab); else next.delete('tab');
        if (nextRole && nextRole !== 'ALL') next.set('role', nextRole); else next.delete('role');
        if (nextSearch && nextSearch.trim()) next.set('search', nextSearch.trim()); else next.delete('search');
        if (nextPage > 1) next.set('page', String(nextPage)); else next.delete('page');

        setSearchParams(next, { replace: true });
    };

    const setActiveTab = (tab: 'ALL' | 'ACTIVE' | 'INACTIVE') => {
        setActiveTabState(tab);
        setCurrentPageState(1);
        updateQueryParams({ tab, page: 1 });
    };

    const setSelectedRole = (role: string) => {
        setSelectedRoleState(role);
        setCurrentPageState(1);
        updateQueryParams({ role, page: 1 });
    };

    const setSearchQuery = (query: string) => {
        setSearchQueryState(query);
        setCurrentPageState(1);
        updateQueryParams({ search: query, page: 1 });
    };

    const setCurrentPage = (page: number) => {
        setCurrentPageState(page);
        updateQueryParams({ page });
    };

    useEffect(() => {
        const tab = (searchParams.get('tab') as 'ALL' | 'ACTIVE' | 'INACTIVE') || 'ALL';
        const role = searchParams.get('role') || 'ALL';
        const search = searchParams.get('search') || '';
        const page = Number(searchParams.get('page')) || 1;
        setActiveTabState(tab);
        setSelectedRoleState(role);
        setSearchQueryState(search);
        setCurrentPageState(page);
    }, [searchParams]);




    const itemsPerPage = 8;

    const [showModal, setShowModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<{ id: number; name: string; status: string; roleName: string } | null>(null);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await api.get('/staff');
            setStaffList(response.data);
            setError(null);
        } catch (err: any) {
            console.error("Error fetching staff data:", err);
            setError(err.response?.data?.message || "Failed to load staff accounts.");
        } finally {
            setLoading(false);
        }
    };

    const [, setAvatarVersion] = useState(0);

    useEffect(() => {
        fetchStaff();

        // Listen for avatar updates from Profile or other tabs
        const onAvatarUpdate = () => setAvatarVersion(v => v + 1);
        window.addEventListener('avatarChange', onAvatarUpdate);
        window.addEventListener('storage', onAvatarUpdate);
        return () => {
            window.removeEventListener('avatarChange', onAvatarUpdate);
            window.removeEventListener('storage', onAvatarUpdate);
        };
    }, []);

    const getStaffAvatar = (staff: StaffResponseDTO): string | null => {
        const isSelf = currentUser.email?.toLowerCase() === staff.email?.toLowerCase() || 
                       currentUser.username?.toLowerCase() === staff.userName?.toLowerCase();
        return (
            localStorage.getItem(`avatar_${staff.email?.toLowerCase()}`) ||
            localStorage.getItem(`avatar_${staff.email}`) ||
            localStorage.getItem(`avatar_${staff.userName?.toLowerCase()}`) ||
            localStorage.getItem(`avatar_${staff.userName}`) ||
            localStorage.getItem(`avatar_${staff.userId}`) ||
            (isSelf ? localStorage.getItem('currentUserAvatar') : null) ||
            null
        );
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, selectedRole, searchQuery]);

    const formatDateTimeDMY = (dateString?: string): string => {
        if (!dateString) return '—';
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return dateString;
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            return `${day}/${month}/${year}`;
        } catch {
            return dateString;
        }
    };

    const filteredStaff = staffList.filter((staff) => {
        const matchesTab = activeTab === 'ALL' || staff.status === activeTab;
        
        const matchesRole = selectedRole === 'ALL' || 
            (selectedRole === 'SALES_STAFF' 
                ? (staff.roleName === 'SALES_STAFF' || staff.roleName === 'ORDER_STAFF') 
                : staff.roleName === selectedRole);

        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = !q || 
            staff.userName.toLowerCase().includes(q) || 
            staff.email.toLowerCase().includes(q);

        return matchesTab && matchesRole && matchesSearch;
    });

    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentStaffData = filteredStaff.slice(startIndex, startIndex + itemsPerPage);

    const renderRoleBadge = (role: string, email: string) => {
        const isSuper = email?.toLowerCase() === 'admin@ecommerce.com';
        if (isSuper) {
            return <span className="staff-badge badge-super-admin">👑 SUPER ADMIN</span>;
        }
        switch (role) {
            case 'ADMIN': 
                return <span className="staff-badge badge-role-admin">🛡️ SYSTEM ADMIN</span>;
            case 'INVENTORY_STAFF': 
                return <span className="staff-badge badge-role-inventory">INVENTORY STAFF</span>;
            case 'SALES_STAFF': 
            case 'ORDER_STAFF': 
                return <span className="staff-badge badge-role-sales">ORDER / SALES STAFF</span>;
            default: 
                return <span className="staff-badge badge-role-default">{role.replace('_', ' ')}</span>;
        }
    };

    const handleEdit = (id: number) => {
        navigate(`/admin/staff/edit/${id}`);
    };

    const openConfirmModal = (id: number, name: string, status: string, roleName: string, email: string) => {
        // Prevent modifying own status
        if (currentUser.email === email || currentUser.username === name) {
            alert("You cannot change the status of your own logged-in account.");
            return;
        }

        // Super Admin account can never be deactivated
        if (email?.toLowerCase() === 'admin@ecommerce.com') {
            alert("The primary Super Administrator account can never be suspended.");
            return;
        }

        // Administrator accounts can only be suspended or deactivated by Super Administrator
        if (roleName?.toUpperCase() === 'ADMIN' && !isCurrentSuperAdmin) {
            alert("Only the primary Super Administrator can suspend or deactivate another administrator.");
            return;
        }

        setSelectedStaff({ id, name, status, roleName });
        setShowModal(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedStaff) return;

        const { id, status } = selectedStaff;
        const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

        try {
            await api.put(`/staff/${id}/status`, null, {
                params: { status: newStatus }
            });

            setStaffList(prevList => prevList.map(staff => staff.userId === id ? { ...staff, status: newStatus } : staff));
            setShowModal(false);
            setSelectedStaff(null);
        } catch (err: any) {
            console.error("Error updating account status:", err);
            alert(err.response?.data?.message || "Failed to update account status.");
            setShowModal(false);
        }
    };

    return (
        <div className="staff-container">
            <div className="header-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <BackButton fallbackUrl="/admin/dashboard" />
                    <div>
                        <h2 className="header-title">Staff &amp; Administrator Management</h2>
                        <p className="header-subtitle">Manage system administrators and back-office staff accounts</p>
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

                <div className="card" style={{ borderColor: 'rgba(216, 180, 254, 0.9)' }}>
                    <div className="icon-box icon-purple">🛡️</div>
                    <div>
                        <p className="card-value">
                            {staffList.filter(s => s.roleName === 'ADMIN').length}
                        </p>
                        <p className="card-label">Administrators</p>
                    </div>
                </div>

                <div className="card">
                    <div className="icon-box icon-blue">📦</div>
                    <div>
                        <p className="card-value">{staffList.filter(s => s.roleName === 'INVENTORY_STAFF').length}</p>
                        <p className="card-label">Inventory Staff</p>
                    </div>
                </div>

                <div className="card">
                    <div className="icon-box icon-green">🛍️</div>
                    <div>
                        <p className="card-value">
                            {staffList.filter(s => s.roleName === 'SALES_STAFF' || s.roleName === 'ORDER_STAFF').length}
                        </p>
                        <p className="card-label">Order / Sales Staff</p>
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
                            All ({staffList.length})
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}
                            onClick={() => setActiveTab('ACTIVE')}
                        >
                            Active ({staffList.filter(s => s.status === 'ACTIVE').length})
                        </button>
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === 'INACTIVE' ? 'active' : ''}`}
                            onClick={() => setActiveTab('INACTIVE')}
                        >
                            Inactive ({staffList.filter(s => s.status !== 'ACTIVE').length})
                        </button>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FiFilter size={14} color="#64748b" />
                            <select
                                className="search-input"
                                style={{ width: '180px', padding: '7.5px 10px', cursor: 'pointer' }}
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            >
                                <option value="ALL">All Roles</option>
                                <option value="ADMIN">System Admin</option>
                                <option value="INVENTORY_STAFF">Inventory Staff</option>
                                <option value="SALES_STAFF">Order / Sales Staff</option>
                            </select>
                        </div>

                        <input
                            type="text"
                            placeholder="🔍 Search name, email..."
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
                                <th style={{ width: '60px', textAlign: 'center' }}>No.</th>
                                <th>Staff / Administrator</th>
                                <th>Role</th>
                                <th style={{ textAlign: 'center' }}>Status</th>
                                <th style={{ textAlign: 'center' }}>Created Date</th>
                                <th style={{ textAlign: 'center', width: '180px', minWidth: '180px' }}>
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentStaffData.length > 0 ? (
                                currentStaffData.map((staff, index) => {
                                    const rowNumber = startIndex + index + 1;
                                    const isSuperAdminUser = staff.email?.toLowerCase() === 'admin@ecommerce.com';
                                    const isAdminRole = staff.roleName?.toUpperCase() === 'ADMIN';
                                    const isSelf = currentUser.email === staff.email || currentUser.username === staff.userName;
                                    const canManageTarget = isCurrentSuperAdmin || !isAdminRole;

                                    return (
                                        <tr 
                                            key={staff.userId}
                                            style={isSuperAdminUser ? { 
                                                background: 'rgba(254, 243, 199, 0.28)',
                                                borderLeft: '3px solid #f59e0b'
                                            } : undefined}
                                        >
                                            {/* Row Number Cell */}
                                            <td className="text-center" style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>
                                                {rowNumber}
                                            </td>

                                            {/* Staff Name & Email with Avatar */}
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    {getStaffAvatar(staff) ? (
                                                        <div className="avatar-mini avatar-mini-has-img" title={staff.userName}>
                                                            <img src={getStaffAvatar(staff)!} alt={staff.userName} className="avatar-mini-img" />
                                                        </div>
                                                    ) : (
                                                        <div className={`avatar-mini ${isSuperAdminUser ? 'avatar-super' : isAdminRole ? 'avatar-admin' : staff.roleName === 'INVENTORY_STAFF' ? 'avatar-inventory' : 'avatar-sales'}`}>
                                                            {isSuperAdminUser ? '👑' : isAdminRole ? '🛡️' : staff.userName ? staff.userName.charAt(0).toUpperCase() : 'U'}
                                                        </div>
                                                    )}

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                            <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '13.5px' }}>
                                                                {staff.userName}
                                                            </span>
                                                            {isSuperAdminUser && (
                                                                <span style={{ 
                                                                    fontSize: '11px', 
                                                                    background: '#fef3c7', 
                                                                    color: '#92400e', 
                                                                    border: '1px solid #fde68a', 
                                                                    padding: '1px 6px', 
                                                                    borderRadius: '4px', 
                                                                    fontWeight: '700' 
                                                                }}>
                                                                    Root Super Admin
                                                                </span>
                                                            )}
                                                            {isSelf && (
                                                                <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '500' }}>
                                                                    (You)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span style={{ fontSize: '12px', color: '#64748b' }}>{staff.email}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Role Badge */}
                                            <td>{renderRoleBadge(staff.roleName, staff.email)}</td>

                                            {/* Status Badge */}
                                            <td className="text-center" style={{ textAlign: 'center' }}>
                                                <span className={`staff-badge ${staff.status === 'ACTIVE' ? 'badge-status-active' : 'badge-status-inactive'}`}>
                                                    {staff.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>

                                            {/* Created Date */}
                                            <td className="text-center" style={{ color: '#475569', fontSize: '12.5px', whiteSpace: 'nowrap', textAlign: 'center' }}>
                                                {formatDateTimeDMY(staff.createdAt)}
                                            </td>

                                            {/* Actions - Modern Compact Soft Pills */}
                                            <td style={{ textAlign: 'center' }}>
                                                <div className="action-pill-group">
                                                    <button
                                                        type="button"
                                                        className="action-pill action-pill-edit"
                                                        onClick={() => handleEdit(staff.userId)}
                                                        title="Edit account details"
                                                    >
                                                        <FiEdit2 size={12} style={{ flexShrink: 0 }} />
                                                        <span>Edit</span>
                                                    </button>

                                                    {isSuperAdminUser ? (
                                                        <span className="action-pill-protected" title="Primary Super Administrator cannot be suspended">
                                                            <FiShield size={11} />
                                                            <span>Protected</span>
                                                        </span>
                                                    ) : isSelf ? (
                                                        <span className="action-pill-self" title="Currently logged in as this user">
                                                            <FiUser size={11} />
                                                            <span>You</span>
                                                        </span>
                                                    ) : (isAdminRole && !isCurrentSuperAdmin) ? (
                                                        <span className="action-pill-protected" title="Administrators can only be managed by Super Administrator">
                                                            <FiShield size={11} />
                                                            <span>Admin Protected</span>
                                                        </span>
                                                    ) : staff.status === 'ACTIVE' ? (
                                                        <button
                                                            type="button"
                                                            className="action-pill action-pill-suspend"
                                                            disabled={!canManageTarget}
                                                            style={!canManageTarget ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                                                            onClick={() => openConfirmModal(staff.userId, staff.userName, staff.status, staff.roleName, staff.email)}
                                                            title={!canManageTarget ? "Admin accounts require Super Admin privileges" : "Suspend staff account"}
                                                        >
                                                            <FiSlash size={12} style={{ flexShrink: 0 }} />
                                                            <span>Suspend</span>
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            className="action-pill action-pill-activate"
                                                            disabled={!canManageTarget}
                                                            style={!canManageTarget ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                                                            onClick={() => openConfirmModal(staff.userId, staff.userName, staff.status, staff.roleName, staff.email)}
                                                            title={!canManageTarget ? "Admin accounts require Super Admin privileges" : "Activate staff account"}
                                                        >
                                                            <FiCheck size={12} style={{ flexShrink: 0 }} />
                                                            <span>Activate</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                                        No staff accounts found matching your filter criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pagination-container">
                    <span className="pagination-info">
                        Showing {filteredStaff.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStaff.length)} of {filteredStaff.length} Accounts
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

            {showModal && selectedStaff && (
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
                        width: '420px',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ marginBottom: '10px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                            {selectedStaff.status === 'ACTIVE' ? 'Confirm Account Suspension' : 'Confirm Account Activation'}
                        </h3>
                        <p style={{ marginBottom: '22px', color: '#475569', fontSize: '13.5px', lineHeight: '1.5' }}>
                            Are you sure you want to <b>{selectedStaff.status === 'ACTIVE' ? 'suspend' : 'activate'}</b> the account for <b>{selectedStaff.name}</b>?
                            {selectedStaff.status === 'ACTIVE' && (
                                <span style={{ display: 'block', marginTop: '6px', color: '#dc2626', fontSize: '12px' }}>
                                    Suspended users will lose access to the system immediately.
                                </span>
                            )}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                            <button 
                                type="button"
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '9px 18px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                onClick={handleConfirmAction}
                                style={{
                                    padding: '9px 20px',
                                    backgroundColor: selectedStaff.status === 'ACTIVE' ? '#dc2626' : '#16a34a',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    boxShadow: selectedStaff.status === 'ACTIVE' ? '0 2px 8px rgba(220, 38, 38, 0.3)' : '0 2px 8px rgba(22, 163, 74, 0.3)'
                                }}
                            >
                                Confirm {selectedStaff.status === 'ACTIVE' ? 'Suspension' : 'Activation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
