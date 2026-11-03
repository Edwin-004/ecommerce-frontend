import { BackButton } from '../../components/common/BackButton';
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

    // Custom Modal State
    const [modalConfig, setModalConfig] = useState<{ show: boolean; message: string; type: 'success' | 'error' | 'warning' }>({ show: false, message: '', type: 'success' });

    const showModal = (message: string, type: 'success' | 'error' | 'warning') => {
        setModalConfig({ show: true, message, type });
    };

    const handleModalClose = () => {
        setModalConfig({ ...modalConfig, show: false });
        if (modalConfig.type === 'success') {
            navigate('/admin/staff'); 
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if(newStaff.roleName === 'ADMIN') {
            showModal("You cannot create a new ADMIN account.", 'warning');
            return;
        }

        setLoading(true);
        try {
            await api.post('/staff', newStaff);
            showModal("Staff account created successfully.", 'success');
        } catch (err) {
            console.error("Error creating staff:", err);
            showModal("An error occurred while creating the staff account.", 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-staff-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '50px 20px', position: 'relative' }}>
            
            <div style={{ width: '100%', maxWidth: '600px' }}>
                
                <div className="create-staff-header" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
                    <BackButton fallbackUrl="/admin/staff" />
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
                                <option value="ADMIN">ADMIN (Full System Access)</option>
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

            {/* Custom Modal Box */}
            {modalConfig.show && (
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
                        width: '350px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        textAlign: 'center'
                    }}>
                        <div style={{ 
                            fontSize: '40px', 
                            marginBottom: '10px', 
                            color: modalConfig.type === 'success' ? '#16a34a' : modalConfig.type === 'warning' ? '#f59e0b' : '#dc2626' 
                        }}>
                            {modalConfig.type === 'success' ? '✅' : modalConfig.type === 'warning' ? '⚠️' : '❌'}
                        </div>
                        <h3 style={{ marginBottom: '12px', fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>
                            {modalConfig.type === 'success' ? 'Success' : modalConfig.type === 'warning' ? 'Warning' : 'Error'}
                        </h3>
                        <p style={{ marginBottom: '20px', color: '#4b5563', fontSize: '15px' }}>
                            {modalConfig.message}
                        </p>
                        <button 
                            onClick={handleModalClose}
                            style={{
                                padding: '8px 24px',
                                backgroundColor: modalConfig.type === 'success' ? '#16a34a' : '#374151',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};