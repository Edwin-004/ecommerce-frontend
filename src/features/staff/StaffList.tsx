import { BackButton } from '../../components/common/BackButton';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiSlash, FiCheck } from 'react-icons/fi';
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
    const [searchQuery, setSearchQuery] = useState('');

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [showModal, setShowModal] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState<{ id: number; name: string; status: string } | null>(null);

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

    const openConfirmModal = (id: number, name: string, status: string) => {
        setSelectedStaff({ id, name, status });
        setShowModal(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedStaff) return;

        const { id, name, status } = selectedStaff;
        const newStatus = status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const actionText = status === 'ACTIVE' ? 'Suspend' : 'Activate';

        try {
            await api.put(`/staff/${id}/status`, null, {
                params: { status: newStatus }
            });

            setStaffList(prevList => prevList.map(staff => staff.userId === id ? { ...staff, status: newStatus } : staff));
            setShowModal(false);
            setSelectedStaff(null);
        } catch (err) {
            console.error(`Error ${actionText.toLowerCase()}ing staff:`, err);
            alert(`${actionText} လုပ်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။`);
            setShowModal(false);
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading staff data...</div>;
    if (error) return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>{error}</div>;

    return (
        <div className="staff-container">
            <div className="header-section">
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <BackButton fallbackUrl="/admin/dashboard" />
                    <div>
                        <h2 className="header-title">Staff Management</h2>
                    <p className="header-subtitle">Manage system users, roles, and account statuses</p>
                </div>
              </div>
                <button className="btn-add" onClick={() => navigate('/admin/staff/new')}>
                    + Add New Staff
                </button>
            </div>

            <div className="summary-cards">
                <div className="card">
                    <div className="icon-box icon-blue">👥</div>
                    <div>
                        <p className="card-value">{staffList.length}</p>
                        <p className="card-label">Total Staff</p>
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
                        <p className="card-label">Inactive Staff</p>
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
                    
                    <div>
                        <input
                            type="text"
                            placeholder="🔍 Search staff..."
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
                                currentStaffData.map((staff) => (
                                    <tr key={staff.userId}>
                                        <td style={{ fontWeight: '500' }}>{staff.userName}</td>
                                        <td>{staff.email}</td>
                                        <td>
                                            <span className={`staff-badge ${getRoleBadgeClass(staff.roleName)}`}>
                                                {staff.roleName.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`staff-badge ${staff.status === 'ACTIVE' ? 'badge-status-active' : 'badge-status-inactive'}`}>
                                                {staff.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>{staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <div className="table-action-group">
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
                                                        onClick={() => openConfirmModal(staff.userId, staff.userName, staff.status)}
                                                        title="Suspend staff account"
                                                    >
                                                        <FiSlash size={12} /> Suspend
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        className="table-btn-activate"
                                                        onClick={() => openConfirmModal(staff.userId, staff.userName, staff.status)}
                                                        title="Activate staff account"
                                                    >
                                                        <FiCheck size={12} /> Activate
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#6b7280' }}>
                                        No staff found matching your criteria.
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

            {showModal && selectedStaff && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: '#fff',
                        padding: '24px',
                        borderRadius: '8px',
                        width: '400px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                            အတည်ပြုရန်
                        </h3>
                        <p style={{ marginBottom: '20px', color: '#4b5563', fontSize: '14px' }}>
                            <b>{selectedStaff.name}</b> ၏ အကောင့်ကို {selectedStaff.status === 'ACTIVE' ? 'Suspend' : 'Activate'} လုပ်မှာ သေချာပြီလား?
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                            <button 
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#e5e7eb',
                                    color: '#374151',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleConfirmAction}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: selectedStaff.status === 'ACTIVE' ? '#dc2626' : '#16a34a',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
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