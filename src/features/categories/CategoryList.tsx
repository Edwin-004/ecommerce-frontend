import React, { useState, useRef, useEffect } from "react";
import {
  FiSearch,
  FiList,
  FiGitBranch,
  FiFolder,
  FiChevronDown,
  FiChevronRight,
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiFileText,
  FiCheckCircle,
  FiX,
} from "react-icons/fi";
import api from "../../utils/axiosConfig";
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
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'excel' | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    if (showExportMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showExportMenu]);

  // Auto-dismiss export success message after 5 seconds
  useEffect(() => {
    if (exportSuccessMessage) {
      const timer = setTimeout(() => {
        setExportSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [exportSuccessMessage]);

  const handleExportCategoryReport = async (format: 'pdf' | 'excel') => {
    setExportingFormat(format);
    setExportSuccessMessage(null);

    try {
      const response = await api.get('/reports/categories', {
        params: { format },
        responseType: 'blob',
      });

      const contentType =
        format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      const blob = new Blob([response.data], { type: contentType });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const todayStr = new Date().toISOString().slice(0, 10);
      const ext = format === 'excel' ? 'xlsx' : 'pdf';
      const filename = `Category_Summary_Report_${todayStr}.${ext}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setExportSuccessMessage(`Downloaded: ${filename}`);
    } catch (err: any) {
      console.error(`Export Category ${format.toUpperCase()} error:`, err);
      alert(`Failed to export Category ${format.toUpperCase()}. Please check your connection or login session.`);
    } finally {
      setExportingFormat(null);
    }
  };
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

  return (
    <section className={styles.card}>
      {/* Exporting In-Progress Floating Banner */}
      {exportingFormat && (
        <div className={styles.exportProgressBanner}>
          <div className={styles.exportProgressSpinner} />
          <div className={styles.exportProgressContent}>
            <span className={styles.exportProgressTitle}>
              Generating Category {exportingFormat === 'pdf' ? 'PDF Report' : 'Excel Document'}...
            </span>
            <span className={styles.exportProgressSubtitle}>
              Compiling category summary report. Your download will start shortly.
            </span>
          </div>
        </div>
      )}

      {/* Export Success Floating Toast */}
      {exportSuccessMessage && (
        <div className={styles.exportSuccessToast}>
          <div className={styles.exportSuccessIcon}>
            <FiCheckCircle size={20} />
          </div>
          <div className={styles.exportSuccessContent}>
            <span className={styles.exportSuccessTitle}>Export Successful!</span>
            <span className={styles.exportSuccessSubtitle}>{exportSuccessMessage}</span>
          </div>
          <button
            type="button"
            className={styles.exportToastClose}
            onClick={() => setExportSuccessMessage(null)}
            title="Dismiss"
          >
            <FiX size={15} />
          </button>
        </div>
      )}

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

        <div className={styles.toolbarActions}>
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

          {/* Unified Category Export Dropdown */}
          <div className={styles.exportDropdownContainer} ref={exportMenuRef}>
            <button
              type="button"
              className={`${styles.exportBtn} ${exportingFormat ? styles.btnActionExporting : ''}`}
              onClick={() => setShowExportMenu((prev) => !prev)}
              disabled={!!exportingFormat}
              title="Export Category Summary Report as PDF or Excel"
            >
              {exportingFormat ? (
                <>
                  <span className={styles.exportSpinner} />
                  Exporting {exportingFormat.toUpperCase()}...
                </>
              ) : (
                <>
                  <FiDownload size={14} />
                  Export
                  <FiChevronDown size={13} style={{ marginLeft: 2 }} />
                </>
              )}
            </button>

            {showExportMenu && !exportingFormat && (
              <div className={styles.exportDropdownMenu}>
                <div className={styles.exportDropdownHeader}>Export As</div>
                <button
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExportCategoryReport('excel');
                  }}
                >
                  <div className={styles.exportMenuIconExcel}>
                    <FiFileText size={16} />
                  </div>
                  <div className={styles.exportMenuText}>
                    <span className={styles.exportMenuTitle}>Excel Document</span>
                    <span className={styles.exportMenuSub}>Spreadsheet (.xlsx)</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={() => {
                    setShowExportMenu(false);
                    handleExportCategoryReport('pdf');
                  }}
                >
                  <div className={styles.exportMenuIconPdf}>
                    <FiFileText size={16} />
                  </div>
                  <div className={styles.exportMenuText}>
                    <span className={styles.exportMenuTitle}>PDF Document</span>
                    <span className={styles.exportMenuSub}>Summary Report (.pdf)</span>
                  </div>
                </button>
              </div>
            )}
          </div>
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