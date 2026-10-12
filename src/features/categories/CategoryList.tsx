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
            <div className={styles.treeRow}>
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
                ) : (
                  <span className={styles.expandSpace} />
                )}

                <span className={styles.folderIcon}>
                  <FiFolder />
                </span>

                <span>{node.categoryName}</span>

                {/* Tree View ထဲတွင် Main Category လုို့ ပြင်ဆင်ထားပါသည် */}
                {depth === 0 && (
                  <span className={styles.rootBadge}>Main Category</span>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.editBtn}
                  onClick={() => onEdit(node)}
                  title="Edit"
                >
                  <FiEdit2 />
                </button>

                <button
                  type="button"
                  className={styles.deleteBtn}
                  onClick={() => onDelete(node.categoryId)}
                  title="Delete"
                >
                  <FiTrash2 />
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
                <th>Parent</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCategories.map((cat) => (
                <tr key={cat.categoryId}>
                  <td>
                    <span className={styles.idText}>#{cat.categoryId}</span>
                  </td>

                  <td>
                    <div className={styles.categoryCell}>
                      <span className={styles.categoryIcon}>
                        <FiFolder />
                      </span>
                      <span>{cat.categoryName}</span>
                    </div>
                  </td>

                  <td>
                    {cat.parentName ? (
                      <span className={styles.parentBadge}>
                        {cat.parentName}
                      </span>
                    ) : (
                      /* Flat View ထဲတွင် Root အစား Main Category ဟု ပြင်ဆင်ထားပါသည် */
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
                        className={styles.editBtn}
                        onClick={() => onEdit(cat)}
                        title="Edit category"
                      >
                        <FiEdit2 />
                      </button>

                      <button
                        type="button"
                        className={styles.deleteBtn}
                        onClick={() => onDelete(cat.categoryId)}
                        title="Delete category"
                      >
                        <FiTrash2 />
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