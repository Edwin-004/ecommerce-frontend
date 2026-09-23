import React, { useEffect, useState } from 'react';
import { categoryApi } from './categoryApi';
import {type CategoryRequestDto,type CategoryResponseDto } from '../../types/category';
import styles from './CategoryManagement.module.css';

export const CategoryManagement: React.FC = () => {
  const CURRENT_USER_ID = 1; // Backend မှ User ID လိုအပ်ချက်အတွက် (Login System မှ ပို့ပေးရန်)

  const [viewMode, setViewMode] = useState<'flat' | 'tree'>('flat');
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
  const [treeCategories, setTreeCategories] = useState<CategoryResponseDto[]>([]);
  const [flatAll, setFlatAll] = useState<CategoryResponseDto[]>([]);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<CategoryRequestDto>({
    categoryName: '',
    description: '',
    parentId: null,
    userId: CURRENT_USER_ID,
  });

  // Load Data
  useEffect(() => {
    fetchData();
  }, [viewMode]);

  const fetchData = async () => {
    setErrorMessage(null);
    try {
      if (viewMode === 'flat') {
        const data = await categoryApi.getAllCategories(0, 50);
        setCategories(data.content);
      } else {
        const treeData = await categoryApi.getCategoryTree();
        setTreeCategories(treeData);
      }
      
      // Select Box အတွက် Dropdown Data
      const all = await categoryApi.getAllCategories(0, 1000);
      setFlatAll(all.content);
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to fetch categories.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'parentId' ? (value ? Number(value) : null) : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      if (editingId) {
        await categoryApi.updateCategory(editingId, formData);
      } else {
        await categoryApi.createCategory(formData);
      }
      resetForm();
      fetchData();
    } catch (err: any) {
      // Backend Exception မှ ပြန်လာသော error message ကို ပြခြင်း
      setErrorMessage(err.response?.data?.message || err.message || 'Operation failed.');
    }
  };

  const handleEdit = (category: CategoryResponseDto) => {
    setEditingId(category.categoryId);
    setFormData({
      categoryName: category.categoryName,
      description: category.description || '',
      parentId: category.parentId || null,
      userId: CURRENT_USER_ID,
    });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    setErrorMessage(null);

    try {
      await categoryApi.deleteCategory(id);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Cannot delete category containing sub-categories.');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      categoryName: '',
      description: '',
      parentId: null,
      userId: CURRENT_USER_ID,
    });
  };

  // Tree View Render Recursive Component
  const renderTree = (nodes: CategoryResponseDto[]) => (
    <ul className={styles.treeList}>
      {nodes.map((node) => (
        <li key={node.categoryId} className={styles.treeItem}>
          <div>
            <strong>📁 {node.categoryName}</strong>
            <span style={{ marginLeft: 12 }}>
              <button onClick={() => handleEdit(node)} className={`${styles.actionBtn} ${styles.editBtn}`}>Edit</button>
              <button onClick={() => handleDelete(node.categoryId)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Delete</button>
            </span>
          </div>
          {node.children && node.children.length > 0 && renderTree(node.children)}
        </li>
      ))}
    </ul>
  );

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Category Management</h1>

      {errorMessage && <div className={styles.errorText}>⚠️ {errorMessage}</div>}

      <div className={styles.grid}>
        {/* Form Panel */}
        <div className={styles.card}>
          <h3>{editingId ? 'Edit Category' : 'Create Category'}</h3>
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Category Name *</label>
              <input
                type="text"
                name="categoryName"
                value={formData.categoryName}
                onChange={handleInputChange}
                required
                maxLength={120}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Parent Category</label>
              <select
                name="parentId"
                value={formData.parentId || ''}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="">-- No Parent (Root Category) --</option>
                {flatAll
                  .filter((cat) => cat.categoryId !== editingId) // Self-reference မဖြစ်အောင် ပိတ်ထားခြင်း
                  .map((cat) => (
                    <option key={cat.categoryId} value={cat.categoryId}>
                      {cat.categoryName}
                    </option>
                  ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className={styles.textarea}
              />
            </div>

            <button type="submit" className={styles.submitBtn}>
              {editingId ? 'Update Category' : 'Save Category'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className={styles.cancelBtn}>
                Cancel Edit
              </button>
            )}
          </form>
        </div>

        {/* Display List Panel */}
        <div className={styles.card}>
          <div className={styles.tabButtons}>
            <button
              className={`${styles.tabBtn} ${viewMode === 'flat' ? styles.activeTab : ''}`}
              onClick={() => setViewMode('flat')}
            >
              Flat View
            </button>
            <button
              className={`${styles.tabBtn} ${viewMode === 'tree' ? styles.activeTab : ''}`}
              onClick={() => setViewMode('tree')}
            >
              Tree Hierarchy View
            </button>
          </div>

          {viewMode === 'flat' ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Parent</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.categoryId}>
                    <td>{cat.categoryId}</td>
                    <td>{cat.categoryName}</td>
                    <td>{cat.parentName || '-'}</td>
                    <td>
                      <button onClick={() => handleEdit(cat)} className={`${styles.actionBtn} ${styles.editBtn}`}>Edit</button>
                      <button onClick={() => handleDelete(cat.categoryId)} className={`${styles.actionBtn} ${styles.deleteBtn}`}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div>{renderTree(treeCategories)}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;