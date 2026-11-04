import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiSlash, FiCheck, FiPlus, FiUsers, FiCheckCircle, FiShield, FiUserX, FiSearch } from 'react-icons/fi';
import api from '../../utils/axiosConfig';
import { formatDate } from '../../utils/dateUtils'; 
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
    const [searchQuery, setSearchQuery] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const fetchStaff = async () => {
        try {
            const response = await api.get('/staff');
            setStaffList(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching staff data:", err);
            setError("this is error");
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery]);

    const filteredStaff = staffList.filter((staff) => {
        const matchesTab = activeTab === 'ALL' || staff.status === activeTab;
        const matchesSearch = staff.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              staff.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentStaffData = filteredStaff.slice(startIndex, startIndex + itemsPerPage);

    const getRoleBadgeClass = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'badge-role-admin';
            case 'INVENTORY_STAFF': return 'badge-role-inventory';
            case 'SALES_STAFF': return 'badge-role-sales';
            case 'ORDER_STAFF': return 'badge-role-order';
            default: return 'badge-role-default';
        }
    };

    const handleEdit = (id: number, _name?: string) => {
        navigate(`/admin/staff/edit/${id}`);
    };

    async function handleStatusToggle(id: number, name: string, currentStatus: string) {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const actionText = currentStatus === 'ACTIVE' ? 'Suspend' : 'Activate';

        if (window.confirm(`${name} á á€¡á€€á€±á€¬á€„á€·á€ºá€€á€­á€¯ ${actionText} á€œá€¯á€•á€ºá€™á€¾á€¬ á€žá€±á€á€»á€¬á€•á€¼á€®á€œá€¬á€¸?`)) {
            try {
                await api.put(`/staff/${id}/status`, null, {
                    params: { status: newStatus }
                });

                setStaffList(prevList => prevList.map(staff => staff.userId === id ? { ...staff, status: newStatus } : staff
                ));
            } catch (err) {
                console.error(`Error ${actionText.toLowerCase()}ing staff:`, err);
                alert(`${actionText} á€œá€¯á€•á€ºá€›á€¬á€á€½á€„á€º á€¡á€™á€¾á€¬á€¸á€¡á€šá€½á€„á€ºá€¸á€–á€¼á€…á€ºá€•á€±á€«á€ºá€á€²á€·á€•á€«á€žá€Šá€ºá‹`);
            }
        }
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading staff data...</div>;
    if (error) return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>{error}</div>;

    return (
        <div className="staff-container">
            {/* Header Section */}
            <div className="header-section">
                <div>
                    <h1 className="header-title text-xl font-semibold text-slate-900 tracking-tight">Staff Management</h1>
                    <p className="header-subtitle text-xs text-slate-500">Manage system users, roles, and account statuses</p>
                </div>
                <button className="btn-add" onClick={() => navigate('/admin/staff/new')}>
                    <FiPlus size={16} /> Add New Staff
                </button>
            </div>

            {/* Summary Cards */}
            <div className="summary-cards">
                <div className="card">
                    <div className="icon-box icon-blue"><FiUsers size={20} /></div>
                    <div>
                        <p className="card-value">{staffList.length}</p>
                        <p className="card-label">Total Staff</p>
                    </div>
                </div>
                
                <div className="card">
                    <div className="icon-box icon-green"><FiCheckCircle size={20} /></div>
                    <div>
                        <p className="card-value">
                            {staffList.filter(s => s.status === 'ACTIVE').length}
                        </p>
                        <p className="card-label">Active Accounts</p>
                    </div>
                </div>

                <div className="card">
                    <div className="icon-box icon-purple"><FiShield size={20} /></div>
                    <div>
                        <p className="card-value">
                            {staffList.filter(s => s.roleName === 'ADMIN').length}
                        </p>
                        <p className="card-label">Administrators</p>
                    </div>
                </div>

                <div className="card">
                    <div className="icon-box icon-red"><FiUserX size={20} /></div>
                    <div>
                        <p className="card-value">
                            {staffList.filter(s => s.status !== 'ACTIVE').length}
                        </p>
                        <p className="card-label">Inactive Staff</p>
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="table-section">
                <div className="table-controls">
                    <div className="tabs">
                        <button
                            type="button"
                            className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}
                            onClick={() => setActiveTab('ALL')}
                        >
                            All Staff
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
                    
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <FiSearch style={{ position: 'absolute', left: 12, color: '#94a3b8', pointerEvents: 'none' }} size={15} />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            className="search-input"
                            style={{ paddingLeft: '34px' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className={`staff-table ${currentStaffData.length > 0 ? 'table-with-data' : 'table-empty'}`}>
                        <thead>
                            <tr>
                                {/* Row Number Column */}
                                <th className="text-center" style={{ width: '60px', textAlign: 'center' }}>No.</th>
                                <th style={{ minWidth: '160px', textAlign: 'left' }}>Name</th>
                                <th style={{ minWidth: '220px', textAlign: 'left' }}>Email</th>
                                <th style={{ minWidth: '140px', textAlign: 'left' }}>Role</th>
                                <th className="text-center" style={{ width: '120px', textAlign: 'center' }}>Status</th>
                                <th className="text-center" style={{ width: '140px', textAlign: 'center' }}>Created At</th>
                                <th className="text-center" style={{ width: '190px', textAlign: 'center' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentStaffData.length > 0 ? (
                                currentStaffData.map((staff, index) => {
                                    const rowNumber = (currentPage - 1) * itemsPerPage + index + 1;
                                    return (
                                    <tr key={staff.userId}>
                                        {/* Row Number Cell */}
                                        <td className="text-center" style={{ textAlign: 'center', fontWeight: 600, color: '#64748b' }}>{rowNumber}</td>
                                        <td style={{ fontWeight: '500' }}>{staff.userName}</td>
                                        <td>{staff.email}</td>
                                        <td>
                                            <span className={`staff-badge ${getRoleBadgeClass(staff.roleName)}`}>
                                                {staff.roleName.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="text-center" style={{ textAlign: 'center' }}>
                                            <span className={`staff-badge ${staff.status === 'ACTIVE' ? 'badge-status-active' : 'badge-status-inactive'}`}>
                                                {staff.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="text-center" style={{ textAlign: 'center' }}>{formatDate(staff.createdAt)}</td>
                                        <td className="text-center" style={{ textAlign: 'center' }}>
                                            <div className="table-action-group" style={{ justifyContent: 'center' }}>
                                                <button
                                                    type="button"
                                                    className="table-btn-edit"
                                                    onClick={() => handleEdit(staff.userId, staff.userName)}
                                                    title="Edit staff account"
                                                >
                                                    <FiEdit2 size={12} /> Edit
                                                </button>
                                                
                                                {staff.status === 'ACTIVE' ? (
                                                    <button
                                                        type="button"
                                                        className="table-btn-delete"
                                                        onClick={() => handleStatusToggle(staff.userId, staff.userName, staff.status)}
                                                        title="Suspend staff account"
                                                    >
                                                        <FiSlash size={12} /> Suspend
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="table-btn-activate"
                                                        onClick={() => handleStatusToggle(staff.userId, staff.userName, staff.status)}
                                                        title="Activate staff account"
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
                                    <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                                        No staff found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer with Adjusted Compact Pagination */}
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
        </div>
    );
};