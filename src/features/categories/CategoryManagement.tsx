
import React, { useEffect, useState } from "react";
import {
  FiLayers,
  FiFolder,
  FiGitBranch,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiList,
  FiChevronDown,
  FiChevronRight,
  FiRefreshCw,
  FiX,
  FiSave,
} from "react-icons/fi";

import { categoryApi } from "./categoryApi";

import {
  type CategoryRequestDto,
  type CategoryResponseDto,
} from "../../types/category";

import styles from "./CategoryManagement.module.css";

export const CategoryManagement: React.FC = () => {
  const [viewMode, setViewMode] =
    useState<"flat" | "tree">("flat");

  const [categories, setCategories] =
    useState<CategoryResponseDto[]>([]);

  const [treeCategories, setTreeCategories] =
    useState<CategoryResponseDto[]>([]);

  const [flatAll, setFlatAll] =
    useState<CategoryResponseDto[]>([]);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [successMessage, setSuccessMessage] =
    useState<string | null>(null);

  const [expanded, setExpanded] =
    useState<number[]>([]);

  // =========================================================
  // FORM DATA
  // =========================================================

  const [formData, setFormData] =
    useState<CategoryRequestDto>({
      categoryName: "",
      description: "",
      parentId: null,
    });

  // =========================================================
  // FETCH DATA
  // =========================================================

  const fetchData = async () => {
    setLoading(true);

    try {
      const [flat, tree, all] =
        await Promise.all([
          categoryApi.getAllCategories(0, 50),
          categoryApi.getCategoryTree(),
          categoryApi.getAllCategories(0, 1000),
        ]);

      setCategories(flat.content);
      setTreeCategories(tree);
      setFlatAll(all.content);

      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Failed to load categories."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchData();
  }, []);

  // =========================================================
  // INPUT CHANGE
  // =========================================================

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement |
        HTMLTextAreaElement |
        HTMLSelectElement
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

  // =========================================================
  // RESET FORM
  // =========================================================

  const resetForm = () => {
    setEditingId(null);

    setFormData({
      categoryName: "",
      description: "",
      parentId: null,
    });
  };

  // =========================================================
  // CREATE / UPDATE
  // =========================================================

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!formData.categoryName.trim()) {
      setErrorMessage(
        "Category name is required."
      );
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      if (editingId !== null) {
        await categoryApi.updateCategory(
          editingId,
          formData
        );

        setSuccessMessage(
          "Category updated successfully."
        );
      } else {
        await categoryApi.createCategory(
          formData
        );

        setSuccessMessage(
          "Category created successfully."
        );
      }

      resetForm();

      await fetchData();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Operation failed."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // EDIT
  // =========================================================

  const handleEdit = (
    category: CategoryResponseDto
  ) => {
    setEditingId(category.categoryId);

    setFormData({
      categoryName:
        category.categoryName,

      description:
        category.description || "",

      parentId:
        category.parentId ?? null,
    });

    setErrorMessage(null);
    setSuccessMessage(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (
    id: number
  ) => {
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

      if (editingId === id) {
        resetForm();
      }

      setSuccessMessage(
        "Category deleted successfully."
      );

      await fetchData();
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message ||
          "Cannot delete this category."
      );
    }
  };

  // =========================================================
  // GET DESCENDANT IDS
  // =========================================================

  const getDescendantIds = (
    id: number,
    visited = new Set<number>()
  ): Set<number> => {
    if (visited.has(id)) {
      return visited;
    }

    visited.add(id);

    flatAll
      .filter(
        (cat) => cat.parentId === id
      )
      .forEach((cat) =>
        getDescendantIds(
          cat.categoryId,
          visited
        )
      );

    return visited;
  };

  // =========================================================
  // AVAILABLE PARENT CATEGORIES
  // =========================================================

  const invalidParentIds =
    editingId !== null
      ? getDescendantIds(editingId)
      : new Set<number>();

  const availableParents =
    flatAll.filter(
      (cat) =>
        !invalidParentIds.has(
          cat.categoryId
        )
    );

  // =========================================================
  // FLAT SEARCH
  // =========================================================

  const filteredCategories =
    categories.filter((cat) => {
      const keyword =
        search.toLowerCase().trim();

      return (
        cat.categoryName
          .toLowerCase()
          .includes(keyword) ||
        (cat.parentName || "")
          .toLowerCase()
          .includes(keyword)
      );
    });

  // =========================================================
  // TREE SEARCH
  // =========================================================

  const matchesSearch = (
    node: CategoryResponseDto
  ): boolean => {
    const keyword =
      search.toLowerCase().trim();

    return (
      node.categoryName
        .toLowerCase()
        .includes(keyword) ||
      (node.children || []).some(
        matchesSearch
      )
    );
  };

  const filteredTree =
    treeCategories.filter(
      (node) =>
        !search ||
        matchesSearch(node)
    );

  // =========================================================
  // TOGGLE TREE
  // =========================================================

  const toggleExpand = (
    id: number
  ) => {
    setExpanded((prev) =>
      prev.includes(id)
        ? prev.filter(
            (x) => x !== id
          )
        : [...prev, id]
    );
  };

  // =========================================================
  // RENDER TREE
  // =========================================================

  const renderTree = (
    nodes: CategoryResponseDto[],
    depth = 0
  ): React.ReactNode => (
    <div className={styles.treeList}>
      {nodes.map((node) => {
        const hasChildren =
          (node.children?.length || 0) > 0;

        const isExpanded =
          expanded.includes(
            node.categoryId
          ) || search.length > 0;

        return (
          <div
            key={node.categoryId}
            className={styles.treeItem}
          >
            <div className={styles.treeRow}>
              <div
                className={styles.treeName}
              >
                {hasChildren ? (
                  <button
                    type="button"
                    className={
                      styles.expandBtn
                    }
                    onClick={() =>
                      toggleExpand(
                        node.categoryId
                      )
                    }
                    aria-label="Toggle category"
                  >
                    {isExpanded ? (
                      <FiChevronDown />
                    ) : (
                      <FiChevronRight />
                    )}
                  </button>
                ) : (
                  <span
                    className={
                      styles.expandSpace
                    }
                  />
                )}

                <span
                  className={
                    styles.folderIcon
                  }
                >
                  <FiFolder />
                </span>

                <span>
                  {node.categoryName}
                </span>

                {depth === 0 && (
                  <span
                    className={
                      styles.rootBadge
                    }
                  >
                    Root
                  </span>
                )}
              </div>

              <div
                className={styles.actions}
              >
                <button
                  type="button"
                  className={
                    styles.editBtn
                  }
                  onClick={() =>
                    handleEdit(node)
                  }
                  title="Edit"
                >
                  <FiEdit2 />
                </button>

                <button
                  type="button"
                  className={
                    styles.deleteBtn
                  }
                  onClick={() =>
                    handleDelete(
                      node.categoryId
                    )
                  }
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>

            {hasChildren &&
              isExpanded && (
                <div
                  className={
                    styles.treeChildren
                  }
                >
                  {renderTree(
                    node.children || [],
                    depth + 1
                  )}
                </div>
              )}
          </div>
        );
      })}
    </div>
  );

  // =========================================================
  // STATISTICS
  // =========================================================

  const rootCount =
    flatAll.filter(
      (cat) => cat.parentId == null
    ).length;

  const subCount =
    flatAll.filter(
      (cat) => cat.parentId != null
    ).length;

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1>Category Management</h1>

          <p>
            Organize and manage your
            product categories
          </p>
        </div>

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

      {/* Statistics */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={`${styles.statIcon} ${styles.blue}`}
          >
            <FiLayers />
          </div>

          <div>
            <h2>{flatAll.length}</h2>
            <p>Total Categories</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={`${styles.statIcon} ${styles.green}`}
          >
            <FiFolder />
          </div>

          <div>
            <h2>{rootCount}</h2>
            <p>Root Categories</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={`${styles.statIcon} ${styles.purple}`}
          >
            <FiGitBranch />
          </div>

          <div>
            <h2>{subCount}</h2>
            <p>Subcategories</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {errorMessage && (
        <div className={styles.errorAlert}>
          <span>{errorMessage}</span>

          <button
            type="button"
            onClick={() =>
              setErrorMessage(null)
            }
          >
            <FiX />
          </button>
        </div>
      )}

      {/* Success */}
      {successMessage && (
        <div
          className={
            styles.successAlert
          }
        >
          <span>{successMessage}</span>

          <button
            type="button"
            onClick={() =>
              setSuccessMessage(null)
            }
          >
            <FiX />
          </button>
        </div>
      )}

      <div className={styles.mainGrid}>
        {/* CATEGORY FORM */}
        <section className={styles.card}>
          <div
            className={styles.cardHeader}
          >
            <div
              className={
                styles.headerIcon
              }
            >
              {editingId !== null ? (
                <FiEdit2 />
              ) : (
                <FiPlus />
              )}
            </div>

            <div>
              <h3>
                {editingId !== null
                  ? "Edit Category"
                  : "Create Category"}
              </h3>

              <p>
                {editingId !== null
                  ? "Update category information"
                  : "Add a new product category"}
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className={styles.form}
          >
            {/* Category Name */}
            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="categoryName">
                Category Name
                <span
                  className={
                    styles.required
                  }
                >
                  {" "}*
                </span>
              </label>

              <input
                id="categoryName"
                name="categoryName"
                type="text"
                placeholder="e.g. Electronics"
                value={
                  formData.categoryName
                }
                onChange={
                  handleInputChange
                }
                maxLength={120}
                required
              />
            </div>

            {/* Parent Category */}
            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="parentId">
                Parent Category
              </label>

              <select
                id="parentId"
                name="parentId"
                value={
                  formData.parentId ?? ""
                }
                onChange={
                  handleInputChange
                }
              >
                <option value="">
                  No Parent (Root Category)
                </option>

                {availableParents.map(
                  (cat) => (
                    <option
                      key={cat.categoryId}
                      value={
                        cat.categoryId
                      }
                    >
                      {cat.categoryName}
                    </option>
                  )
                )}
              </select>

              <small>
                Leave empty to create a
                root category.
              </small>
            </div>

            {/* Description */}
            <div
              className={
                styles.formGroup
              }
            >
              <label htmlFor="description">
                Description
                <span
                  className={
                    styles.optional
                  }
                >
                  {" "}(Optional)
                </span>
              </label>

              <textarea
                id="description"
                name="description"
                placeholder="Enter category description..."
                rows={4}
                value={
                  formData.description
                }
                onChange={
                  handleInputChange
                }
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              className={
                styles.submitBtn
              }
              disabled={saving}
            >
              {editingId !== null ? (
                <FiSave />
              ) : (
                <FiPlus />
              )}

              {saving
                ? "Saving..."
                : editingId !== null
                  ? "Update Category"
                  : "Create Category"}
            </button>

            {/* Cancel */}
            {editingId !== null && (
              <button
                type="button"
                className={
                  styles.cancelBtn
                }
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </form>
        </section>

        {/* CATEGORY LIST */}
        <section className={styles.card}>
          <div
            className={styles.listHeader}
          >
            <div>
              <h3>All Categories</h3>

              <p>
                View and manage your
                categories
              </p>
            </div>

            <span
              className={
                styles.countBadge
              }
            >
              {flatAll.length} Total
            </span>
          </div>

          {/* Toolbar */}
          <div className={styles.toolbar}>
            <div
              className={
                styles.searchBox
              }
            >
              <FiSearch />

              <input
                type="text"
                placeholder="Search categories..."
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
              />
            </div>

            <div
              className={
                styles.viewTabs
              }
            >
              <button
                type="button"
                className={
                  viewMode === "flat"
                    ? styles.activeTab
                    : styles.tabBtn
                }
                onClick={() =>
                  setViewMode("flat")
                }
              >
                <FiList />
                Flat
              </button>

              <button
                type="button"
                className={
                  viewMode === "tree"
                    ? styles.activeTab
                    : styles.tabBtn
                }
                onClick={() =>
                  setViewMode("tree")
                }
              >
                <FiGitBranch />
                Tree
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div
              className={
                styles.emptyState
              }
            >
              Loading categories...
            </div>
          ) : viewMode === "flat" ? (
            <div
              className={
                styles.tableWrapper
              }
            >
              <table
                className={styles.table}
              >
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Category</th>
                    <th>Parent</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCategories.map(
                    (cat) => (
                      <tr
                        key={
                          cat.categoryId
                        }
                      >
                        <td>
                          <span
                            className={
                              styles.idText
                            }
                          >
                            #{cat.categoryId}
                          </span>
                        </td>

                        <td>
                          <div
                            className={
                              styles.categoryCell
                            }
                          >
                            <span
                              className={
                                styles.categoryIcon
                              }
                            >
                              <FiFolder />
                            </span>

                            <span>
                              {
                                cat.categoryName
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          {cat.parentName ? (
                            <span
                              className={
                                styles.parentBadge
                              }
                            >
                              {
                                cat.parentName
                              }
                            </span>
                          ) : (
                            <span
                              className={
                                styles.rootBadge
                              }
                            >
                              Root
                            </span>
                          )}
                        </td>

                        <td>
                          <div
                            className={
                              styles.actions
                            }
                          >
                            <button
                              type="button"
                              className={
                                styles.editBtn
                              }
                              onClick={() =>
                                handleEdit(
                                  cat
                                )
                              }
                              title="Edit category"
                            >
                              <FiEdit2 />
                            </button>

                            <button
                              type="button"
                              className={
                                styles.deleteBtn
                              }
                              onClick={() =>
                                handleDelete(
                                  cat.categoryId
                                )
                              }
                              title="Delete category"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>

              {filteredCategories.length ===
                0 && (
                <div
                  className={
                    styles.emptyState
                  }
                >
                  <FiFolder />

                  <p>
                    No categories found
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div
              className={
                styles.treeContainer
              }
            >
              {filteredTree.length > 0 ? (
                renderTree(filteredTree)
              ) : (
                <div
                  className={
                    styles.emptyState
                  }
                >
                  No categories found
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CategoryManagement;

