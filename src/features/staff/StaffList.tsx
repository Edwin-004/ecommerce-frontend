import { BackButton } from '../../components/common/BackButton';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { type RootState } from '../../store';
import { toast } from 'react-toastify';
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

interface StaffAvatarItemProps {
    staff: StaffResponseDTO;
    isSuperAdminUser: boolean;
    isAdminRole: boolean;
    avatarUrl: string | null;
    onClearBadAvatar: (staff: StaffResponseDTO) => void;
}

const StaffAvatarItem: React.FC<StaffAvatarItemProps> = ({
    staff,
    isSuperAdminUser,
    isAdminRole,
    avatarUrl,
    onClearBadAvatar
}) => {
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        setFailed(false);
    }, [avatarUrl]);

    if (avatarUrl && !failed) {
        return (
            <div className="avatar-mini avatar-mini-has-img" title={staff.userName}>
                <img
                    src={avatarUrl}
                    alt={staff.userName}
                    className="avatar-mini-img"
                    onError={() => {
                        setFailed(true);
                        onClearBadAvatar(staff);
                    }}
                />
            </div>
        );
    }

    return (
        <div className={`avatar-mini ${isSuperAdminUser ? 'avatar-super' : isAdminRole ? 'avatar-admin' : staff.roleName === 'INVENTORY_STAFF' ? 'avatar-inventory' : 'avatar-sales'}`}>
            {isSuperAdminUser ? '👑' : isAdminRole ? '🛡️' : staff.userName ? staff.userName.charAt(0).toUpperCase() : 'U'}
        </div>
    );
};

export const StaffList: React.FC = () => {
    const navigate = useNavigate();
    const currentUser = useSelector((state: RootState) => state.auth);
    const isCurrentSuperAdmin = currentUser?.email?.toLowerCase() === 'admin@ecommerce.com';

    const [staffList, setStaffList] = useState<StaffResponseDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [searchParams, setSearchParams] = useSearchParams();

    const activeTab = (searchParams.get('tab') as 'ALL' | 'ACTIVE' | 'INACTIVE') || 'ALL';
    const selectedRole = searchParams.get('role') || 'ALL';
    const searchQuery = searchParams.get('search') || '';
    const currentPage = Math.max(1, Number(searchParams.get('page')) || 1);

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

    const setActiveTab = (tab: 'ALL' | 'ACTIVE' | 'INACTIVE') => updateQueryParams({ tab, page: 1 });
    const setSelectedRole = (role: string) => updateQueryParams({ role, page: 1 });
    const setSearchQuery = (query: string) => updateQueryParams({ search: query, page: 1 });
    const setCurrentPage = (page: number) => updateQueryParams({ page });

    const itemsPerPage = 8;

    const [showModal, setShowModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<{ id: number; name: string; status: string; roleName: string } | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await api.get('/staff');
            setStaffList(response.data);
            setError(null);
        } catch (err: any) {
            console.error("Error fetching staff data:", err);
            const msg = err.response?.data?.message || "Failed to load staff accounts.";
            setError(msg);
            toast.error(msg);
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

    const isValidAvatar = (val: string | null | undefined): boolean => {
        if (!val) return false;
        const trimmed = val.trim();
        if (
            trimmed === '' ||
            trimmed === 'null' ||
            trimmed === 'undefined' ||
            trimmed === '[object Object]' ||
            trimmed.length < 5
        ) {
            return false;
        }
        return (
            trimmed.startsWith('data:image/') ||
            trimmed.startsWith('http://') ||
            trimmed.startsWith('https://') ||
            trimmed.startsWith('/') ||
            trimmed.startsWith('blob:')
        );
    };

    const getStaffAvatar = (staff: StaffResponseDTO): string | null => {
        const isSelf = currentUser.email?.toLowerCase() === staff.email?.toLowerCase() || 
                       currentUser.username?.toLowerCase() === staff.userName?.toLowerCase();
        const candidates = [
            localStorage.getItem(`avatar_${staff.email?.toLowerCase()}`),
            localStorage.getItem(`avatar_${staff.email}`),
            localStorage.getItem(`avatar_${staff.userName?.toLowerCase()}`),
            localStorage.getItem(`avatar_${staff.userName}`),
            localStorage.getItem(`avatar_${staff.userId}`),
            isSelf ? localStorage.getItem('currentUserAvatar') : null
        ];
        for (const c of candidates) {
            if (isValidAvatar(c)) return c!;
        }
        return null;
    };

    const handleClearBadAvatar = (badStaff: StaffResponseDTO) => {
        try {
            if (badStaff.email) {
                localStorage.removeItem(`avatar_${badStaff.email.toLowerCase()}`);
                localStorage.removeItem(`avatar_${badStaff.email}`);
            }
            if (badStaff.userName) {
                localStorage.removeItem(`avatar_${badStaff.userName.toLowerCase()}`);
                localStorage.removeItem(`avatar_${badStaff.userName}`);
            }
            if (badStaff.userId) {
                localStorage.removeItem(`avatar_${badStaff.userId}`);
            }
            const isSelf = currentUser.email?.toLowerCase() === badStaff.email?.toLowerCase() || 
                           currentUser.username?.toLowerCase() === badStaff.userName?.toLowerCase();
            if (isSelf) {
                localStorage.removeItem('currentUserAvatar');
            }
            window.dispatchEvent(new Event('avatarChange'));
        } catch {
            // ignore
        }
    };

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

    const handleEdit = (id: number, email?: string) => {
        if (currentUser.email && email && currentUser.email.toLowerCase() === email.toLowerCase()) {
            navigate('/admin/profile');
            return;
        }
        if (email?.toLowerCase() === 'admin@ecommerce.com' && !isCurrentSuperAdmin) {
            toast.warning("You do not have permission to view or edit the Super Administrator account.");
            return;
        }
        navigate(`/admin/staff/edit/${id}`);
    };

    const openConfirmModal = (id: number, name: string, status: string, roleName: string, email: string) => {
        // Prevent modifying own status
        if (currentUser.email?.toLowerCase() === email?.toLowerCase() || currentUser.username === name) {
            toast.warning("You cannot change the status of your own logged-in account.");
            return;
        }

        // Super Admin account can never be deactivated
        if (email?.toLowerCase() === 'admin@ecommerce.com') {
            toast.error("The primary Super Administrator account can never be suspended.");
            return;
        }

        // Administrator accounts can only be suspended or deactivated by Super Administrator
        if (roleName?.toUpperCase() === 'ADMIN' && !isCurrentSuperAdmin) {
            toast.error("Only the primary Super Administrator can suspend or deactivate another administrator.");
            return;
        }

        setSelectedStaff({ id, name, status, roleName });
        setShowModal(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedStaff) return;

        const { id, name, status } = selectedStaff;
        const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

        setActionLoading(true);
        try {
            await api.put(`/staff/${id}/status`, null, {
                params: { status: newStatus }
            });

            setStaffList(prevList => prevList.map(staff => staff.userId === id ? { ...staff, status: newStatus } : staff));
            
            if (newStatus === 'INACTIVE') {
                toast.success(`Account for "${name}" has been suspended.`);
            } else {
                toast.success(`Account for "${name}" has been activated.`);
            }
            setShowModal(false);
            setSelectedStaff(null);
        } catch (err: any) {
            console.error("Error updating account status:", err);
            toast.error(err.response?.data?.message || "Failed to update account status.");
            setShowModal(false);
        } finally {
            setActionLoading(false);
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
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                                        Loading staff accounts...
                                    </td>
                                </tr>
                            ) : error ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#ef4444' }}>
                                        {error}
                                    </td>
                                </tr>
                            ) : currentStaffData.length > 0 ? (
                                currentStaffData.map((staff, index) => {
                                    const rowNumber = startIndex + index + 1;
                                    const isSuperAdminUser = staff.email?.toLowerCase() === 'admin@ecommerce.com';
                                    const isAdminRole = staff.roleName?.toUpperCase() === 'ADMIN';
                                    const isSelf = currentUser.email?.toLowerCase() === staff.email?.toLowerCase() || currentUser.username === staff.userName;
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
                                                    <StaffAvatarItem
                                                        staff={staff}
                                                        isSuperAdminUser={isSuperAdminUser}
                                                        isAdminRole={isAdminRole}
                                                        avatarUrl={getStaffAvatar(staff)}
                                                        onClearBadAvatar={handleClearBadAvatar}
                                                    />

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
                                                    {/* Hide Edit button if this is Super Admin and logged-in user is NOT Super Admin */}
                                                    {(!isSuperAdminUser || isCurrentSuperAdmin) && (
                                                        isSelf ? (
                                                            <button
                                                                type="button"
                                                                className="action-pill action-pill-profile"
                                                                onClick={() => navigate('/admin/profile')}
                                                                title="View and manage your own profile"
                                                            >
                                                                <FiUser size={12} style={{ flexShrink: 0 }} />
                                                                <span>My Profile</span>
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                className="action-pill action-pill-edit"
                                                                onClick={() => handleEdit(staff.userId, staff.email)}
                                                                title="Edit account details"
                                                            >
                                                                <FiEdit2 size={12} style={{ flexShrink: 0 }} />
                                                                <span>Edit</span>
                                                            </button>
                                                        )
                                                    )}

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
                            onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
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
                            onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Modern Status Confirmation Modal */}
            {showModal && selectedStaff && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(15, 23, 42, 0.45)',
                        backdropFilter: 'blur(4px)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => !actionLoading && setShowModal(false)}
                >
                    <div 
                        style={{
                            backgroundColor: '#ffffff',
                            padding: '30px 28px',
                            borderRadius: '16px',
                            width: '420px',
                            maxWidth: '90%',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                            textAlign: 'center',
                            position: 'relative'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            backgroundColor: selectedStaff.status === 'ACTIVE' ? '#fee2e2' : '#dcfce7',
                            border: `2px solid ${selectedStaff.status === 'ACTIVE' ? '#fecaca' : '#bbf7d0'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            fontSize: '24px'
                        }}>
                            {selectedStaff.status === 'ACTIVE' ? '⚠️' : '✅'}
                        </div>

                        <h3 style={{ marginBottom: '8px', fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                            {selectedStaff.status === 'ACTIVE' ? 'Confirm Account Suspension' : 'Confirm Account Activation'}
                        </h3>

                        <p style={{ marginBottom: '20px', color: '#475569', fontSize: '13.5px', lineHeight: '1.6' }}>
                            Are you sure you want to <strong>{selectedStaff.status === 'ACTIVE' ? 'suspend' : 'activate'}</strong> the account for <strong style={{ color: '#0f172a' }}>{selectedStaff.name}</strong>?
                            {selectedStaff.status === 'ACTIVE' ? (
                                <span style={{ display: 'block', marginTop: '8px', color: '#dc2626', fontSize: '12.5px', backgroundColor: '#fef2f2', padding: '8px 12px', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                                    🔒 Suspended users will lose their active session and be blocked from signing in immediately.
                                </span>
                            ) : (
                                <span style={{ display: 'block', marginTop: '8px', color: '#15803d', fontSize: '12.5px', backgroundColor: '#f0fdf4', padding: '8px 12px', borderRadius: '8px', border: '1px solid #dcfce7' }}>
                                    🔓 Active users will be granted full access according to their assigned role permissions.
                                </span>
                            )}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                            <button 
                                type="button"
                                disabled={actionLoading}
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '9.5px 20px',
                                    backgroundColor: '#f1f5f9',
                                    color: '#475569',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '8px',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                type="button"
                                disabled={actionLoading}
                                onClick={handleConfirmAction}
                                style={{
                                    padding: '9.5px 22px',
                                    backgroundColor: selectedStaff.status === 'ACTIVE' ? '#dc2626' : '#16a34a',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: actionLoading ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '13px',
                                    boxShadow: selectedStaff.status === 'ACTIVE' ? '0 4px 12px rgba(220, 38, 38, 0.25)' : '0 4px 12px rgba(22, 163, 74, 0.25)'
                                }}
                            >
                                {actionLoading ? 'Updating...' : `Yes, ${selectedStaff.status === 'ACTIVE' ? 'Suspend Account' : 'Activate Account'}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffList;
