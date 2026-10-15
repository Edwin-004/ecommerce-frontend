import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import './CreateStaff.css'; 

export const CreateStaff: React.FC = () => {
    const navigate = useNavigate();
    const [newStaff, setNewStaff] = useState({
        userName: '',
        email: '',
        password: '',
        roleName: 'INVENTORY_STAFF' 
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if(newStaff.roleName === 'ADMIN') {
            alert("စနစ်အတွင်းသို့ ADMIN အကောင့် အသစ်ထည့်သွင်းခွင့် မရှိပါ။");
            return;
        }

        setLoading(true);
        try {
            await api.post('/staff', newStaff);
            alert("ဝန်ထမ်းအသစ် အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ။");
            navigate('/admin/staff'); 
        } catch (err) {
            console.error("Error creating staff:", err);
            alert("ဝန်ထမ်းအသစ် ထည့်သွင်းရာတွင် အမှားဖြစ်ပေါ်ခဲ့ပါသည်။");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-staff-container" style={{ display: 'flex', justifyContent: 'center', padding: '50px 20px' }}>
            
            <div style={{ width: '100%', maxWidth: '600px' }}>
                
                <div className="create-staff-header">
                    {/* ဤနေရာတွင်ရှိသော ဖြတ်ရန်မလိုသည့် Back ခလုတ်ကို ဖယ်ရှားလိုက်ပါပြီ */}
                    <div>
                        <h2 className="header-title">Create New Staff</h2>
                        <p className="header-subtitle">Add a new staff member to the system</p>
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
                                placeholder="Enter staff name"
                                value={newStaff.userName} 
                                onChange={e => setNewStaff({...newStaff, userName: e.target.value})} 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Email Address *</label>
                            <input 
                                type="email" 
                                className="form-input" 
                                required 
                                placeholder="staff@ecommerce.com"
                                value={newStaff.email} 
                                onChange={e => setNewStaff({...newStaff, email: e.target.value})} 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Password *</label>
                            <input 
                                type="password" 
                                className="form-input" 
                                required 
                                placeholder="Create a strong password"
                                value={newStaff.password} 
                                onChange={e => setNewStaff({...newStaff, password: e.target.value})} 
                            />
                        </div>
                        
                        <div className="form-group">
                            <label>Assign Role *</label>
                            <select 
                                className="form-select"
                                value={newStaff.roleName} 
                                onChange={e => setNewStaff({...newStaff, roleName: e.target.value})}
                            >
                                <option value="INVENTORY_STAFF">INVENTORY STAFF (Manage Stock & Products)</option>
                                <option value="SALES_STAFF">SALES STAFF (Manage Orders)</option>
                            </select>
                        </div>
                        
                        <hr className="divider" />
                        
                        <div className="form-actions">
                            <button type="button" className="btn-cancel" onClick={() => navigate('/admin/staff')}>
                                Cancel
                            </button>
                            <button type="submit" className="btn-submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Create Staff Account'}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </div>
    );
};