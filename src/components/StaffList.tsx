import React, { useEffect, useState } from 'react';
import api from '../utils/axiosConfig';
import { useSelector } from 'react-redux'; // <--- အသစ်ထည့်ရန်
import { type RootState } from '../store'; // <--- အသစ်ထည့်ရန်

interface StaffResponseDTO {
    userId: number;
    userName: string;
    email: string;
    roleName: string;
    status: string;
    createdAt: string;
}

const StaffList: React.FC = () => {
    // Redux မှ လက်ရှိ Login ဝင်ထားသူ၏ role ကို ရယူခြင်း
    const { role } = useSelector((state: RootState) => state.auth);

    const [staffList, setStaffList] = useState<StaffResponseDTO[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const [showForm, setShowForm] = useState<boolean>(false);
    const [editingStaffId, setEditingStaffId] = useState<number | null>(null); 
    
    const [formData, setFormData] = useState({
        userName: '',
        email: '',
        password: '',
        roleName: 'INVENTORY_STAFF'
    });
    const [formError, setFormError] = useState<string | null>(null);

    const fetchStaff = async () => {
        try {
            const response = await api.get('/staff');
            setStaffList(response.data);
            setLoading(false);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Staff စာရင်း ခေါ်ယူရာတွင် အမှားအယွင်းဖြစ်ပေါ်နေပါသည်။');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError(null);
        try {
            if (editingStaffId) {
                await api.put(`/staff/${editingStaffId}`, formData);
                alert("Staff အချက်အလက်များကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။");
            } else {
                await api.post('/staff', formData);
                alert("Staff အသစ် အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ။");
            }
            resetForm();
            fetchStaff();
        } catch (err: any) {
            setFormError(err.response?.data?.message || "လုပ်ဆောင်ရာတွင် အမှားအယွင်းဖြစ်နေပါသည်။");
        }
    };

    const handleEdit = (staff: StaffResponseDTO) => {
        setFormData({
            userName: staff.userName,
            email: staff.email,
            password: '', 
            roleName: staff.roleName
        });
        setEditingStaffId(staff.userId);
        setShowForm(true);
    };

    const handleToggleStatus = async (staff: StaffResponseDTO) => {
        const isCurrentlyActive = staff.status === 'ACTIVE';
        const actionText = isCurrentlyActive ? 'ပိတ် (Inactive)' : 'ပြန်ဖွင့် (Active)';
        const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';

        const confirmAction = window.confirm(`ဤအကောင့်ကို ${actionText} လုပ်ရန် သေချာပါသလား?`);
        
        if (confirmAction) {
            try {
                await api.put(`/staff/${staff.userId}/status?status=${newStatus}`);
                alert(`အကောင့်ကို ${newStatus} အဖြစ် အောင်မြင်စွာ ပြောင်းလဲလိုက်ပါပြီ။`);
                fetchStaff();
            } catch (err: any) {
                alert(err.response?.data?.message || "Status ပြောင်းရာတွင် အမှားအယွင်းဖြစ်နေပါသည်။");
            }
        }
    };

    const resetForm = () => {
        setShowForm(false);
        setEditingStaffId(null);
        setFormData({ userName: '', email: '', password: '', roleName: 'INVENTORY_STAFF' });
        setFormError(null);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    return (
        <div style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2>Staff Management</h2>
                
                {/* ADMIN ဖြစ်မှသာ Add New Staff ခလုတ်ကို ပြမည် */}
                {role === 'ADMIN' && (
                    <button 
                        onClick={() => showForm ? resetForm() : setShowForm(true)} 
                        style={{ padding: '10px 15px', background: showForm ? '#f44336' : '#4CAF50', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}
                    >
                        {showForm ? 'Cancel' : '+ Add New Staff'}
                    </button>
                )}
            </div>

            {/* ADMIN ဖြစ်မှသာ Form ကို ပြမည် */}
            {role === 'ADMIN' && showForm && (
                <div style={{ background: '#f9f9f9', padding: '20px', marginBottom: '20px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    <h3>{editingStaffId ? 'Edit Staff Account' : 'Create New Staff Account'}</h3>
                    {formError && <p style={{ color: 'red' }}>{formError}</p>}
                    
                    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div>
                            <label>Name:</label><br/>
                            <input type="text" name="userName" value={formData.userName} onChange={handleInputChange} required style={{ padding: '8px' }}/>
                        </div>
                        <div>
                            <label>Email:</label><br/>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required style={{ padding: '8px' }}/>
                        </div>
                        <div>
                            <label>Password: {editingStaffId && <span style={{ fontSize: '12px', color: 'gray' }}>(အသစ်မပြောင်းလိုပါက အလွတ်ထားပါ)</span>}</label><br/>
                            <input type="password" name="password" value={formData.password} onChange={handleInputChange} required={!editingStaffId} style={{ padding: '8px' }}/>
                        </div>
                        <div>
                            <label>Role:</label><br/>
                            <select name="roleName" value={formData.roleName} onChange={handleInputChange} style={{ padding: '8px' }}>
                                <option value="INVENTORY_STAFF">Inventory Staff</option>
                                <option value="SALES_STAFF">Sales Staff</option>
                            </select>
                        </div>
                        <button type="submit" style={{ padding: '9px 15px', background: '#008CBA', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>
                            {editingStaffId ? 'Update Staff' : 'Save Staff'}
                        </button>
                    </form>
                </div>
            )}

            <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#f2f2f2' }}>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Status</th>
                        <th>Created At</th>
                        {/* ADMIN ဖြစ်မှသာ Actions ခေါင်းစဉ်ကို ပြမည် */}
                        {role === 'ADMIN' && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {staffList.map((staff) => (
                        <tr key={staff.userId}>
                            <td>{staff.userId}</td>
                            <td>{staff.userName}</td>
                            <td>{staff.email}</td>
                            <td>{staff.roleName}</td>
                            <td>
                                <span style={{ color: staff.status === 'ACTIVE' ? 'green' : 'red', fontWeight: 'bold' }}>
                                    {staff.status}
                                </span>
                            </td>
                            <td>{new Date(staff.createdAt).toLocaleDateString()}</td>
                            
                            {/* ADMIN ဖြစ်မှသာ Edit နှင့် Status ခလုတ်များကို ပြမည် */}
                            {role === 'ADMIN' && (
                                <td>
                                    <button onClick={() => handleEdit(staff)} style={{ marginRight: '10px', padding: '5px 10px', background: '#ff9800', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '3px' }}>
                                        Edit
                                    </button>
                                    
                                    <button 
                                        onClick={() => handleToggleStatus(staff)} 
                                        style={{ 
                                            padding: '5px 10px', 
                                            color: 'white', 
                                            background: staff.status === 'ACTIVE' ? '#f44336' : '#4CAF50', 
                                            border: 'none', 
                                            cursor: 'pointer', 
                                            borderRadius: '3px',
                                            width: '100px'
                                        }}
                                    >
                                        {staff.status === 'ACTIVE' ? 'Set Inactive' : 'Set Active'}
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default StaffList;