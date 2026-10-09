import React, { useEffect, useState } from "react";
import {
  FiLayers,
  FiFolder,
  FiGitBranch,
  FiRefreshCw,
  FiX,
  FiPlus,
} from "react-icons/fi";
import { categoryApi } from "./categoryApi";
import { CategoryFormModal } from "./CategoryFormModal";
import { CategoryList } from "./CategoryList";
import {
  type CategoryRequestDto,
  type CategoryResponseDto,
} from "../../types/category";
import styles from "./CategoryManagement.module.css";

export const CategoryManagement: React.FC = () => {
  const [viewMode, setViewMode] = useState<"flat" | "tree">("flat");
  const [categories, setCategories] = useState<CategoryResponseDto[]>([]);
  const [treeCategories, setTreeCategories] = useState<CategoryResponseDto[]>([]);
  const [flatAll, setFlatAll] = useState<CategoryResponseDto[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Modal Open/Close State
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number[]>([]);

  const [formData, setFormData] = useState<CategoryRequestDto>({
    categoryName: "",
    description: "",
    parentId: null,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [flat, tree, all] = await Promise.all([
        categoryApi.getAllCategories(0, 50),
        categoryApi.getCategoryTree(),
        categoryApi.getAllCategories(0, 1000),
      ]);

      setCategories(flat.content);
      setTreeCategories(tree);
      setFlatAll(all.content);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "parentId"
          ? value
            ? Number(value)
            : null
          : value,
    }));
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      categoryName: "",
      description: "",
      parentId: null,
    });
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryName.trim()) {
      setErrorMessage("Category name is required.");
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (editingId !== null) {
        await categoryApi.updateCategory(editingId, formData);
        setSuccessMessage("Category updated successfully.");
      } else {
        await categoryApi.createCategory(formData);
        setSuccessMessage("Category created successfully.");
      }

      // အောင်မြင်မှသာ Modal ကို ပိတ်မည်
      closeModal();
      await fetchData();
    } catch (err: any) {
      // Error တက်ပါက Modal ကို မပိတ်ဘဲ Modal ထဲတွင် Error တိုက်ရိုက်ပြပါမည်
      setErrorMessage(
        err.response?.data?.message || "Operation failed."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category: CategoryResponseDto) => {
    setEditingId(category.categoryId);
    setFormData({
      categoryName: category.categoryName,
      description: category.description || "",
      parentId: category.parentId ?? null,
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await categoryApi.deleteCategory(id);
      setSuccessMessage("Category deleted successfully.");
      await fetchData();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || "Cannot delete this category."
      );
    }
  };

  const getDescendantIds = (
    id: number,
    visited = new Set<number>()
  ): Set<number> => {
    if (visited.has(id)) return visited;
    visited.add(id);

    flatAll
      .filter((cat) => cat.parentId === id)
      .forEach((cat) => getDescendantIds(cat.categoryId, visited));

    return visited;
  };

  const invalidParentIds =
    editingId !== null ? getDescendantIds(editingId) : new Set<number>();

  const availableParents = flatAll.filter(
    (cat) => !invalidParentIds.has(cat.categoryId)
  );

  const filteredCategories = categories.filter((cat) => {
    const keyword = search.toLowerCase().trim();
    return (
      cat.categoryName.toLowerCase().includes(keyword) ||
      (cat.parentName || "").toLowerCase().includes(keyword) ||
      (cat.description || "").toLowerCase().includes(keyword)
    );
  });

  const matchesSearch = (node: CategoryResponseDto): boolean => {
    const keyword = search.toLowerCase().trim();
    return (
      node.categoryName.toLowerCase().includes(keyword) ||
      (node.description || "").toLowerCase().includes(keyword) ||
      (node.children || []).some(matchesSearch)
    );
  };

  const filteredTree = treeCategories.filter(
    (node) => !search || matchesSearch(node)
  );

  const toggleExpand = (id: number) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const rootCount = flatAll.filter((cat) => cat.parentId == null).length;
  const subCount = flatAll.filter((cat) => cat.parentId != null).length;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Category Management</h1>
          <p>Organize and manage your product categories</p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className="btn btn-primary d-flex align-items-center gap-2 px-3"
            onClick={openCreateModal}
          >
            <FiPlus /> Add Category
          </button>

          <button
            type="button"
            className={styles.refreshBtn}
            onClick={fetchData}
            disabled={loading}
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.blue}`}>
            <FiLayers />
          </div>
          <div>
            <h2>{flatAll.length}</h2>
            <p>Total Categories</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.green}`}>
            <FiFolder />
          </div>
          <div>
            <h2>{rootCount}</h2>
            <p>Main Categories</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles.purple}`}>
            <FiGitBranch />
          </div>
          <div>
            <h2>{subCount}</h2>
            <p>Subcategories</p>
          </div>
        </div>
      </div>

      {/* Page Alerts (Delete သို့မဟုတ် အခြားနေရာမှ လာသော Alert များ) */}
      {errorMessage && !isModalOpen && (
        <div className={styles.errorAlert}>
          <span>{errorMessage}</span>
          <button type="button" onClick={() => setErrorMessage(null)}>
            <FiX />
          </button>
        </div>
      )}

      {successMessage && (
        <div className={styles.successAlert}>
          <span>{successMessage}</span>
          <button type="button" onClick={() => setSuccessMessage(null)}>
            <FiX />
          </button>
        </div>
      )}

      {/* Category List */}
      <CategoryList
        viewMode={viewMode}
        setViewMode={setViewMode}
        search={search}
        setSearch={setSearch}
        loading={loading}
        totalCount={flatAll.length}
        filteredCategories={filteredCategories}
        filteredTree={filteredTree}
        expanded={expanded}
        onToggleExpand={toggleExpand}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Create / Edit Modal Popup */}
      <CategoryFormModal
        isOpen={isModalOpen}
        formData={formData}
        editingId={editingId}
        saving={saving}
        errorMessage={errorMessage} // Pass error to modal
        availableParents={availableParents}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </div>
  );
};

export default CategoryManagement;