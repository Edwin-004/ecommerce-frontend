import React, { useState } from 'react';

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

    // Backend မှ ရလာမည့် Data များအတွက် နမူနာ

    const [staffList, setStaffList] = useState<StaffResponseDTO[]>([

        { userId: 1, userName: 'System Admin', email: 'admin@ecommerce.com', roleName: 'ADMIN', status: 'ACTIVE', createdAt: '9/14/2026' },

        { userId: 2, userName: 'Inventory Manager', email: 'inventory@ecommerce.com', roleName: 'INVENTORY_STAFF', status: 'ACTIVE', createdAt: '9/23/2026' },

        { userId: 3, userName: 'Sales Representative', email: 'sales@ecommerce.com', roleName: 'SALES_STAFF', status: 'ACTIVE', createdAt: '9/23/2026' },

        { userId: 4, userName: 'Kaung Kaung', email: 'kaung222@gmail.com', roleName: 'INVENTORY_STAFF', status: 'INACTIVE', createdAt: '9/26/2026' },

    ]);



    // UI အသက်ဝင်စေရန် State များ ထည့်ခြင်း

    const [activeTab, setActiveTab] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

    const [searchQuery, setSearchQuery] = useState('');



    // Tab နှင့် Search ပေါ်မူတည်၍ Data ကို စစ်ထုတ်ခြင်း (Filtering)

    const filteredStaff = staffList.filter((staff) => {

        const matchesTab = activeTab === 'ALL' || staff.status === activeTab;

        const matchesSearch = staff.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||

                              staff.email.toLowerCase().includes(searchQuery.toLowerCase());

        return matchesTab && matchesSearch;

    });



    // ခလုတ်များ နှိပ်သည့်အခါ အလုပ်လုပ်မည့် Function များ (ယခုလောလောဆယ် Alert ပြထားပါသည်)

    const handleAddNew = () => {

        alert("Add New Staff Form ကို ဖွင့်ပါမည်။");

    };



    const handleEdit = (id: number, name: string) => {

        alert(`${name} (ID: ${id}) ကို ပြင်ဆင်ပါမည်။`);

    };



    const handleSuspend = (id: number, name: string) => {

        if(window.confirm(`${name} ကို Suspend လုပ်မှာ သေချာပြီလား?`)) {

            alert(`${name} ကို Suspend လုပ်လိုက်ပါပြီ။ (Backend သို့ API လှမ်းခေါ်ရန် ဤနေရာတွင် ရေးပါ)`);

        }

    };



    return (

        <div className="staff-container">

            {/* Header Section */}

            <div className="header-section">

                <div>

                    <h2 className="header-title">Staff Management</h2>

                    <p className="header-subtitle">Manage system users, roles, and account statuses</p>

                </div>

                <button className="btn-add" onClick={handleAddNew}>

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

                        <button

                            className={`tab-btn ${activeTab === 'ALL' ? 'active' : ''}`}

                            onClick={() => setActiveTab('ALL')}

                        >

                            All Staff

                        </button>

                        <button

                            className={`tab-btn ${activeTab === 'ACTIVE' ? 'active' : ''}`}

                            onClick={() => setActiveTab('ACTIVE')}

                        >

                            Active

                        </button>

                        <button

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

                            {filteredStaff.length > 0 ? (

                                filteredStaff.map((staff) => (

                                    <tr key={staff.userId}>

                                        <td>{staff.userId}</td>

                                        <td style={{ fontWeight: '500' }}>{staff.userName}</td>

                                        <td>{staff.email}</td>

                                        <td>

                                            <span className={`badge ${staff.roleName === 'ADMIN' ? 'badge-admin' : 'badge-staff'}`}>

                                                {staff.roleName}

                                            </span>

                                        </td>

                                        <td>

                                            <span className={`badge ${staff.status === 'ACTIVE' ? 'badge-active' : 'badge-inactive'}`}>

                                                {staff.status === 'ACTIVE' ? 'Active' : 'Inactive'}

                                            </span>

                                        </td>

                                        <td>{staff.createdAt}</td>

                                        <td>

                                            <button

                                                className="action-btn btn-edit"

                                                onClick={() => handleEdit(staff.userId, staff.userName)}

                                            >

                                                Edit

                                            </button>

                                            <button

                                                className="action-btn btn-suspend"

                                                onClick={() => handleSuspend(staff.userId, staff.userName)}

                                            >

                                                Suspend

                                            </button>

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

            </div>

        </div>

    );

}; 

