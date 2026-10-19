import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

    // Pagination State များကို အသစ်ထည့်ထားပါသည်
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

    // Filter သို့မဟုတ် Search ပြောင်းလဲသွားပါက Page 1 သို့ ပြန်သွားရန်
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery]);

    // Data များကို စစ်ထုတ်ခြင်း
    const filteredStaff = staffList.filter((staff) => {
        const matchesTab = activeTab === 'ALL' || staff.status === activeTab;
        const matchesSearch = staff.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              staff.email.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesSearch;
    });

    // Pagination တွက်ချက်မှုများ
    const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentStaffData = filteredStaff.slice(startIndex, startIndex + itemsPerPage);

    const handleEdit = (id: number, name: string) => {
        alert(`${name} (ID: ${id}) ကို ပြင်ဆင်ပါမည်။`);
    };

    const handleStatusToggle = async (id: number, name: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const actionText = currentStatus === 'ACTIVE' ? 'Suspend' : 'Activate';

        if(window.confirm(`${name} ၏ အကောင့်ကို ${actionText} လုပ်မှာ သေချာပြီလား?`)) {
            try {
                await api.put(`/staff/${id}/status`, null, {
                    params: { status: newStatus }
                });

                setStaffList(prevList => 
                    prevList.map(staff => 
                        staff.userId === id ? { ...staff, status: newStatus } : staff
                    )
                );
            } catch (err) {
                console.error(`Error ${actionText.toLowerCase()}ing staff:`, err);
                alert(`${actionText} လုပ်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။`);
            }
        }
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading staff data...</div>;
    if (error) return <div style={{ padding: '40px', textAlign: 'center', color: 'red' }}>{error}</div>;

    return (
        <div className="staff-container">
            {/* Header Section */}
            <div className="header-section">
                <div>
                    <h2 className="header-title">Staff Management</h2>
                    <p className="header-subtitle">Manage system users, roles, and account statuses</p>
                </div>
                <button className="btn-add" onClick={() => navigate('/admin/staff/new')}>
                    + Add New Staff
                </button>
            </div>

            {/* Summary Cards */}
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

            {/* Table Area */}
            <div className="table-section">
                <div className="table-controls">
                    <div className="tabs">
                        <button className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`} onClick={() => setActiveTab('ALL')}>All Staff</button>
                        <button className={`tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`} onClick={() => setActiveTab('ACTIVE')}>Active</button>
                        <button className={`tab-btn ${activeTab === 'INACTIVE' ? 'active' : ''}`} onClick={() => setActiveTab('INACTIVE')}>Inactive</button>
                    </div>
                    
                    <div>
                        <input type="text" placeholder="🔍 Search staff..." className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                    </div>
                </div>

                <div className="table-responsive">
                    <table className="staff-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* Pagination ဖြင့် ဖြတ်ထားသော currentStaffData ကို အသုံးပြုပါသည် */}
                            {currentStaffData.length > 0 ? (
                                currentStaffData.map((staff) => (
                                    <tr key={staff.userId}>
                                        <td>{staff.userId}</td>
                                        <td style={{ fontWeight: '500' }}>{staff.userName}</td>
                                        <td>{staff.email}</td>
                                        <td>
                                            <span className={`badge ${staff.roleName === 'ADMIN' ? 'badge-admin' : 'badge-staff'}`}>
                                                {staff.roleName.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge ${staff.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>
                                                {staff.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td>{staff.createdAt ? new Date(staff.createdAt).toLocaleDateString() : '-'}</td>
                                        <td>
                                            <button className="action-btn btn-edit" onClick={() => handleEdit(staff.userId, staff.userName)}>Edit</button>
                                            
                                            {staff.status === 'ACTIVE' ? (
                                                <button className="action-btn btn-suspend" onClick={() => handleStatusToggle(staff.userId, staff.userName, staff.status)}>
                                                    Suspend
                                                </button>
                                            ) : (
                                                <button className="action-btn" style={{ backgroundColor: '#dcfce7', color: '#166534', fontWeight: 'bold' }} onClick={() => handleStatusToggle(staff.userId, staff.userName, staff.status)}>
                                                    Activate
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
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

                {/* Pagination Controls */}
                {totalPages > 0 && (
                    <div className="pagination-container">
                        <span className="pagination-info">
                            Showing {filteredStaff.length === 0 ? 0 : startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStaff.length)} of {filteredStaff.length} Entries
                        </span>
                        <div className="pagination-controls">
                            <button 
                                className="page-btn" 
                                disabled={currentPage === 1} 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            >
                                Previous
                            </button>
                            
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                <button 
                                    key={page} 
                                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                    onClick={() => setCurrentPage(page)}
                                >
                                    {page}
                                </button>
                            ))}

                            <button 
                                className="page-btn" 
                                disabled={currentPage === totalPages} 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};