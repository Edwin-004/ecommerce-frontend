import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import './EditStaff.css';

export const EditStaff: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        userName: '',
        email: '',
        roleName: 'SALES_STAFF',
        status: 'ACTIVE'
    });
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStaffDetails = async () => {
            try {
                // Backend မှ လက်ရှိ Staff Data ကို ဆွဲယူခြင်း
                const response = await api.get(`/staff/${id}`); 
                setFormData({
                    userName: response.data.userName,
                    email: response.data.email,
                    roleName: response.data.roleName,
                    status: response.data.status
                });
                setLoading(false);
            } catch (err) {
                console.error("Error fetching staff:", err);
                setError("Staff အချက်အလက်များ ရယူရာတွင် အမှားအယွင်းရှိနေပါသည်။");
                setLoading(false);
            }
        };

        if (id) {
            fetchStaffDetails();
        }
    }, [id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // ပြင်ဆင်ထားသော Data များကို Backend သို့ ပို့ပေးခြင်း
            await api.put(`/staff/${id}`, formData);
            alert('Staff အချက်အလက်များ အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။');
            navigate('/admin/staff'); // အောင်မြင်ပါက Staff List သို့ ပြန်သွားမည်
        } catch (err) {
            console.error("Error updating staff:", err);
            alert('ပြင်ဆင်ရာတွင် အမှားအယွင်းဖြစ်ပေါ်ခဲ့ပါသည်။ (Backend API ကို စစ်ဆေးပါ)');
        }
    };

    if (loading) return <div className="loading-text">Loading staff details...</div>;
    if (error) return <div className="error-text">{error}</div>;

    return (
        <div className="edit-staff-container">
            <div className="edit-staff-card">
                <h2 className="edit-staff-title">Edit Staff Member</h2>
                <p className="edit-staff-subtitle">Update information for staff ID: {id}</p>

                <form onSubmit={handleSubmit} className="edit-staff-form">
                    <div className="form-group">
                        <label>Name</label>
                        <input
                            type="text"
                            name="userName"
                            value={formData.userName}
                            onChange={handleChange}
                            required
                            placeholder="Enter full name"
                        />
                    </div>

                    <div className="form-group">
                        <label>Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="Enter email address"
                        />
                    </div>

                    <div className="form-group">
                        <label>Role</label>
                        <select
                            name="roleName"
                            value={formData.roleName}
                            onChange={handleChange}
                        >
                            <option value="ADMIN">Admin</option>
                            <option value="INVENTORY_STAFF">Inventory Staff</option>
                            <option value="SALES_STAFF">Sales Staff</option>
                            <option value="ORDER_STAFF">Order Staff</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Status</label>
                        <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                        >
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                        </select>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-cancel" onClick={() => navigate('/admin/staff')}>
                            Cancel
                        </button>
                        <button type="submit" className="btn-save">
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};