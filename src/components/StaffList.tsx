import React, { useEffect, useState } from 'react';
import api from '../utils/axiosConfig';
import { useSelector } from 'react-redux';
import { type RootState } from '../store';
import styles from './StaffList.module.css';
import {
  FiUsers,
  FiUserPlus,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiSave,
  FiRefreshCw,
  FiAlertCircle,
} from 'react-icons/fi';

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
    roleName: 'INVENTORY_STAFF',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/staff');
      setStaffList(response.data);
      setLoading(false);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Staff စာရင်း ခေါ်ယူရာတွင် အမှားအယွင်းဖြစ်ပေါ်နေပါသည်။'
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (editingStaffId) {
        await api.put(`/staff/${editingStaffId}`, formData);
        alert('Staff အချက်အလက်များကို အောင်မြင်စွာ ပြင်ဆင်ပြီးပါပြီ။');
      } else {
        await api.post('/staff', formData);
        alert('Staff အသစ် အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ။');
      }
      resetForm();
      fetchStaff();
    } catch (err: any) {
      setFormError(
        err.response?.data?.message || 'လုပ်ဆောင်ရာတွင် အမှားအယွင်းဖြစ်နေပါသည်။'
      );
    }
  };

  const handleEdit = (staff: StaffResponseDTO) => {
    setFormData({
      userName: staff.userName,
      email: staff.email,
      password: '',
      roleName: staff.roleName,
    });
    setEditingStaffId(staff.userId);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleStatus = async (staff: StaffResponseDTO) => {
    const isCurrentlyActive = staff.status === 'ACTIVE';
    const actionText = isCurrentlyActive
      ? 'ပိတ် (Inactive)'
      : 'ပြန်ဖွင့် (Active)';
    const newStatus = isCurrentlyActive ? 'INACTIVE' : 'ACTIVE';

    const confirmAction = window.confirm(
      `ဤအကောင့်ကို ${actionText} လုပ်ရန် သေချာပါသလား?`
    );

    if (confirmAction) {
      try {
        await api.put(`/staff/${staff.userId}/status?status=${newStatus}`);
        alert(`အကောင့်ကို ${newStatus} အဖြစ် အောင်မြင်စွာ ပြောင်းလဲလိုက်ပါပြီ။`);
        fetchStaff();
      } catch (err: any) {
        alert(
          err.response?.data?.message ||
            'Status ပြောင်းရာတွင် အမှားအယွင်းဖြစ်နေပါသည်။'
        );
      }
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingStaffId(null);
    setFormData({
      userName: '',
      email: '',
      password: '',
      roleName: 'INVENTORY_STAFF',
    });
    setFormError(null);
  };

  const formatRoleLabel = (r: string) => {
    if (r === 'INVENTORY_STAFF') return 'Inventory Staff';
    if (r === 'SALES_STAFF') return 'Sales Staff';
    if (r === 'ADMIN') return 'Administrator';
    return r;
  };

  if (loading) {
    return (
      <div className={styles.loadingWrapper}>
        <FiRefreshCw className="spin" size={24} style={{ marginRight: '10px' }} />
        <span>Loading staff members...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorAlert} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FiAlertCircle size={18} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h1>
            <FiUsers /> Staff Management
          </h1>
          <p>Manage system staff accounts, operational roles, and access status</p>
        </div>

        <div className={styles.headerActions}>
          <button
            type="button"
            className="btn-secondary"
            onClick={fetchStaff}
            title="Refresh Staff List"
          >
            <FiRefreshCw size={15} /> Refresh
          </button>

          {/* ADMIN ဖြစ်မှသာ Add New Staff ခလုတ်ကို ပြမည် */}
          {role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => (showForm ? resetForm() : setShowForm(true))}
              className={showForm ? 'btn-secondary' : 'btn-primary'}
            >
              {showForm ? (
                <>
                  <FiX size={16} /> Cancel
                </>
              ) : (
                <>
                  <FiUserPlus size={16} /> Add New Staff
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ADMIN ဖြစ်မှသာ Form ကို ပြမည် */}
      {role === 'ADMIN' && showForm && (
        <div className={styles.formCard}>
          <div className={styles.formHeader}>
            <h3>
              {editingStaffId
                ? 'Edit Staff Account'
                : 'Create New Staff Account'}
            </h3>
            <button
              type="button"
              className="table-btn-view"
              onClick={resetForm}
              style={{ border: 'none', background: 'transparent' }}
            >
              <FiX size={18} />
            </button>
          </div>

          {formError && (
            <div className={styles.errorAlert} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiAlertCircle size={16} />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Name *</label>
                <input
                  type="text"
                  name="userName"
                  placeholder="e.g. John Doe"
                  value={formData.userName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  placeholder="e.g. staff@ecommerce.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  Password{' '}
                  {editingStaffId && (
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      (အသစ်မပြောင်းလိုပါက အလွတ်ထားပါ)
                    </span>
                  )}
                  {!editingStaffId && ' *'}
                </label>
                <input
                  type="password"
                  name="password"
                  placeholder={
                    editingStaffId
                      ? 'Leave blank to keep unchanged'
                      : '••••••••'
                  }
                  value={formData.password}
                  onChange={handleInputChange}
                  required={!editingStaffId}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Role *</label>
                <select
                  name="roleName"
                  value={formData.roleName}
                  onChange={handleInputChange}
                >
                  <option value="INVENTORY_STAFF">Inventory Staff</option>
                  <option value="SALES_STAFF">Sales Staff</option>
                </select>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary">
                <FiSave size={16} />
                {editingStaffId ? 'Update Staff' : 'Save Staff'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.staffTable}>
            <thead>
              <tr>
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
              {staffList.length === 0 ? (
                <tr>
                  <td
                    colSpan={role === 'ADMIN' ? 7 : 6}
                    style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}
                  >
                    No staff members found.
                  </td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.userId}>
                    <td style={{ fontWeight: 600, color: '#64748b' }}>
                      #{staff.userId}
                    </td>
                    <td>
                      <div className={styles.userNameCell}>
                        <div className={styles.avatarCircle}>
                          {staff.userName ? staff.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span>{staff.userName}</span>
                      </div>
                    </td>
                    <td style={{ color: '#475569' }}>{staff.email}</td>
                    <td>
                      <span className={styles.roleBadge}>
                        {formatRoleLabel(staff.roleName)}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge-status ${
                          staff.status === 'ACTIVE'
                            ? 'badge-status-active'
                            : 'badge-status-inactive'
                        }`}
                      >
                        {staff.status === 'ACTIVE' ? (
                          <FiCheckCircle size={12} />
                        ) : (
                          <FiXCircle size={12} />
                        )}
                        {staff.status}
                      </span>
                    </td>
                    <td style={{ color: '#64748b', fontSize: '13px' }}>
                      {new Date(staff.createdAt).toLocaleDateString()}
                    </td>

                    {/* ADMIN ဖြစ်မှသာ Edit နှင့် Status ခလုတ်များကို ပြမည် */}
                    {role === 'ADMIN' && (
                      <td>
                        <div className={styles.actionCell}>
                          <button
                            type="button"
                            onClick={() => handleEdit(staff)}
                            className="table-btn-edit"
                            title="Edit Staff"
                          >
                            <FiEdit2 size={13} /> Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(staff)}
                            className={
                              staff.status === 'ACTIVE'
                                ? 'table-btn-delete'
                                : 'table-btn-edit'
                            }
                            title={
                              staff.status === 'ACTIVE'
                                ? 'Deactivate Account'
                                : 'Activate Account'
                            }
                          >
                            {staff.status === 'ACTIVE' ? (
                              <>
                                <FiXCircle size={13} /> Set Inactive
                              </>
                            ) : (
                              <>
                                <FiCheckCircle size={13} /> Set Active
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StaffList;