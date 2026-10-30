
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

  // Load category data
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
        err?.response?.data?.message ||
          "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();

    const params = new URLSearchParams(window.location.search);

    if (params.get("create") === "true") {
      openCreateModal();
    }
  }, []);

  // Handle form inputs
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]:
        name === "parentId"
          ? value
            ? Number(value)
            : null
          : value,
    }));
  };

  // Open create modal
  const openCreateModal = () => {
    setEditingId(null);

    setFormData({
      categoryName: "",
      description: "",
      parentId: null,
    });

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    if (saving) return;

    setIsModalOpen(false);
    setEditingId(null);
    setErrorMessage(null);
  };

  // Create or update category, optionally creating child categories
  const handleSubmit = async (
    e: React.FormEvent,
    subcategoryNames: string[] = []
  ): Promise<void> => {
    e.preventDefault();

    const categoryName = formData.categoryName.trim();

    if (!categoryName) {
      setErrorMessage("Category name is required.");
      return;
    }

    // Validate subcategory names
    const validSubcategories = subcategoryNames
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (editingId !== null) {
        // Update an existing category
        await categoryApi.updateCategory(editingId, {
          ...formData,
          categoryName,
        });

        setSuccessMessage("Category updated successfully.");
      } else {
        // 1. Create the main category first
        const result = await categoryApi.createCategory({
          ...formData,
          categoryName,
          parentId: formData.parentId ?? null,
        });

        // 2. Read the newly created category ID.
        // Adjust this section if your API uses a different response shape.
        const response = result as any;

        const createdCategory =
          response?.categoryId != null
            ? response
            : response?.data?.categoryId != null
              ? response.data
              : response?.data?.data?.categoryId != null
                ? response.data.data
                : null;

        const mainCategoryId = createdCategory?.categoryId;

        // A parent ID is necessary to create child categories.
        if (
          formData.parentId == null &&
          validSubcategories.length > 0 &&
          mainCategoryId == null
        ) {
          throw new Error(
            "The main category was created, but its ID was not returned by the API. The subcategories could not be created."
          );
        }

        // 3. Create each subcategory under the new main category.
        for (const subcategoryName of validSubcategories) {
          await categoryApi.createCategory({
            categoryName: subcategoryName,
            description: "",
            parentId: mainCategoryId,
          });
        }

        setSuccessMessage(
          validSubcategories.length > 0
            ? "Main category and subcategories created successfully."
            : "Category created successfully."
        );
      }

      // Close only after all requested operations succeed.
      setIsModalOpen(false);
      setEditingId(null);
      setErrorMessage(null);

      await fetchData();
    } catch (err: any) {
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Operation failed."
      );
    } finally {
      setSaving(false);
    }
  };

  // Edit category
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

  // Delete category
  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this category?"
      )
    ) {
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
        err?.response?.data?.message ||
          "Cannot delete this category."
      );
    }
  };

  // Get the IDs of a category and all its descendants
  const getDescendantIds = (
    id: number,
    visited = new Set<number>()
  ): Set<number> => {
    if (visited.has(id)) return visited;

    visited.add(id);

    flatAll
      .filter((category) => category.parentId === id)
      .forEach((category) => {
        getDescendantIds(category.categoryId, visited);
      });

    return visited;
  };

  // Prevent selecting the category itself or its descendants as parent
  const invalidParentIds =
    editingId !== null
      ? getDescendantIds(editingId)
      : new Set<number>();

  const availableParents = flatAll.filter(
    (category) => !invalidParentIds.has(category.categoryId)
  );

  // Flat view search
  const filteredCategories = categories.filter((category) => {
    const keyword = search.toLowerCase().trim();

    return (
      category.categoryName.toLowerCase().includes(keyword) ||
      (category.parentName || "").toLowerCase().includes(keyword) ||
      (category.description || "").toLowerCase().includes(keyword)
    );
  });

  // Tree view search
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

  // Expand/collapse tree nodes
  const toggleExpand = (id: number) => {
    setExpanded((previous) =>
      previous.includes(id)
        ? previous.filter((value) => value !== id)
        : [...previous, id]
    );
  };

  // Category statistics
  const rootCount = flatAll.filter(
    (category) => category.parentId == null
  ).length;

  const subCount = flatAll.filter(
    (category) => category.parentId != null
  ).length;

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
            disabled={saving}
          >
            <FiPlus />
            Add Category
          </button>

          <button
            type="button"
            className={styles.refreshBtn}
            onClick={() => void fetchData()}
            disabled={loading || saving}
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics */}
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

      {/* Page-level error alerts */}
      {errorMessage && !isModalOpen && (
        <div className={styles.errorAlert} role="alert">
          <span>{errorMessage}</span>

          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            aria-label="Dismiss error"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Success alert */}
      {successMessage && (
        <div className={styles.successAlert} role="status">
          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            aria-label="Dismiss success message"
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Category list */}
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

      {/* Create / Edit Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        formData={formData}
        editingId={editingId}
        saving={saving}
        errorMessage={errorMessage}
        availableParents={availableParents}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
        onClose={closeModal}
      />
    </div>
  );
};

export default CategoryManagement;
