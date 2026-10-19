import React from "react";
import {
  FiSearch,
  FiList,
  FiGitBranch,
  FiFolder,
  FiChevronDown,
  FiChevronRight,
  FiEdit2,
  FiTrash2,
  FiCornerDownRight,
} from "react-icons/fi";
import { type CategoryResponseDto } from "../../types/category";
import styles from "./CategoryManagement.module.css";

interface CategoryListProps {
  viewMode: "flat" | "tree";
  setViewMode: (mode: "flat" | "tree") => void;
  search: string;
  setSearch: (search: string) => void;
  loading: boolean;
  totalCount: number;
  filteredCategories: CategoryResponseDto[];
  filteredTree: CategoryResponseDto[];
  expanded: number[];
  onToggleExpand: (id: number) => void;
  onEdit: (category: CategoryResponseDto) => void;
  onDelete: (id: number) => Promise<void>;
}

export const CategoryList: React.FC<CategoryListProps> = ({
  viewMode,
  setViewMode,
  search,
  setSearch,
  loading,
  totalCount,
  filteredCategories,
  filteredTree,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
}) => {
  // Tree View ကို အဆင့်လိုက် (Indentation) သေချာခွဲပြရန်
  const renderTree = (
    nodes: CategoryResponseDto[],
    depth = 0
  ): React.ReactNode => (
    <div className={styles.treeList}>
      {nodes.map((node) => {
        const hasChildren = (node.children?.length || 0) > 0;
        const isExpanded =
          expanded.includes(node.categoryId) || search.length > 0;

        return (
          <div key={node.categoryId} className={styles.treeItem}>
            <div
              className={styles.treeRow}
              style={{ paddingLeft: `${depth * 28 + 12}px` }} // Depth အလိုက် ညာဘက်သို့ ရွှေ့ပေးခြင်း
            >
              <div className={styles.treeName}>
                {hasChildren ? (
                  <button
                    type="button"
                    className={styles.expandBtn}
                    onClick={() => onToggleExpand(node.categoryId)}
                    aria-label="Toggle category"
                  >
                    {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
                  </button>
                ) : depth > 0 ? (
                  <FiCornerDownRight
                    className="text-muted me-1"
                    style={{ color: "#94a3b8" }}
                  />
                ) : (
                  <span className={styles.expandSpace} />
                )}

                <span className={styles.folderIcon}>
                  {depth === 0 ? (
                    <FiFolder className="text-primary" />
                  ) : (
                    <FiGitBranch style={{ color: "#8b5cf6" }} />
                  )}
                </span>

                <span className={depth === 0 ? "fw-bold" : "fw-medium"}>
                  {node.categoryName}
                </span>

                {depth === 0 ? (
                  <span className={styles.rootBadge}>Main Category</span>
                ) : (
                  <span
                    className="badge bg-light text-dark border ms-2"
                    style={{ fontSize: "11px" }}
                  >
                    Subcategory
                  </span>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className="table-btn-edit"
                  onClick={() => onEdit(node)}
                  title="Edit"
                >
                  <FiEdit2 size={12} /> Edit
                </button>

                <button
                  type="button"
                  className="table-btn-delete"
                  onClick={() => onDelete(node.categoryId)}
                  title="Delete"
                >
                  <FiTrash2 size={12} /> Delete
                </button>
              </div>
            </div>

            {hasChildren && isExpanded && (
              <div className={styles.treeChildren}>
                {renderTree(node.children || [], depth + 1)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  // Flat View မှာလည်း Parent အလိုက် စီပေးထားခြင်း
  const sortedFlatCategories = React.useMemo(() => {
    const list = [...filteredCategories];
    return list.sort((a, b) => {
      // Main categories များကို အထက်သို့ တင်ပေးပြီး Parent တူရာများကို စီပေးခြင်း
      const parentA = a.parentId ?? a.categoryId;
      const parentB = b.parentId ?? b.categoryId;
      if (parentA === parentB) {
        return a.parentId === null ? -1 : 1;
      }
      return parentA - parentB;
    });
  }, [filteredCategories]);

  return (
    <section className={styles.card}>
      <div className={styles.listHeader}>
        <div>
          <h3>All Categories</h3>
          <p>View and manage your categories</p>
        </div>
        <span className={styles.countBadge}>{totalCount} Total</span>
      </div>

      {/* Toolbar */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.viewTabs}>
          <button
            type="button"
            className={
              viewMode === "flat" ? styles.activeTab : styles.tabBtn
            }
            onClick={() => setViewMode("flat")}
          >
            <FiList />
            Flat
          </button>

          <button
            type="button"
            className={
              viewMode === "tree" ? styles.activeTab : styles.tabBtn
            }
            onClick={() => setViewMode("tree")}
          >
            <FiGitBranch />
            Tree
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.emptyState}>Loading categories...</div>
      ) : viewMode === "flat" ? (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Category</th>
                <th>Parent Category</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedFlatCategories.map((cat) => (
                <tr key={cat.categoryId}>
                  <td>
                    <span className={styles.idText}>#{cat.categoryId}</span>
                  </td>

                  <td>
                    <div className={styles.categoryCell}>
                      <span className={styles.categoryIcon}>
                        {cat.parentId ? (
                          <FiGitBranch style={{ color: "#8b5cf6" }} />
                        ) : (
                          <FiFolder className="text-primary" />
                        )}
                      </span>
                      <span className={cat.parentId ? "" : "fw-bold"}>
                        {cat.categoryName}
                      </span>
                    </div>
                  </td>

                  <td>
                    {cat.parentName ? (
                      <span className={styles.parentBadge}>
                        ↳ {cat.parentName}
                      </span>
                    ) : (
                      <span className={styles.rootBadge}>Main Category</span>
                    )}
                  </td>

                  <td>
                    <span className={styles.descriptionText}>
                      {cat.description && cat.description.trim() !== ""
                        ? cat.description
                        : "-"}
                    </span>
                  </td>

                  <td>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        className="table-btn-edit"
                        onClick={() => onEdit(cat)}
                        title="Edit category"
                      >
                        <FiEdit2 size={12} /> Edit
                      </button>

                      <button
                        type="button"
                        className="table-btn-delete"
                        onClick={() => onDelete(cat.categoryId)}
                        title="Delete category"
                      >
                        <FiTrash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredCategories.length === 0 && (
            <div className={styles.emptyState}>
              <FiFolder />
              <p>No categories found</p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.treeContainer}>
          {filteredTree.length > 0 ? (
            renderTree(filteredTree)
          ) : (
            <div className={styles.emptyState}>No categories found</div>
          )}
        </div>
      )}
    </section>
  );
};