import { toast } from "react-toastify";
import React, { useEffect, useMemo, useRef, useState } from "react";
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
  FiCheckCircle,
  FiX,
  FiDownload,
  FiFileText,
} from "react-icons/fi";
import type { CategoryResponseDto } from "../../types/category";
import styles from "./CategoryManagement.module.css";
import api from "../../utils/axiosConfig";

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
  onDelete: (id: number) => Promise<void> | void;
}

type ExportFormat = "pdf" | "excel";

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
  const [exportingFormat, setExportingFormat] =
    useState<ExportFormat | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] =
    useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export dropdown when clicking outside of it
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  // Escape CSV cell values to make them Excel compatible
  const escapeCsv = (value: unknown): string => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const handleExportCategoryReport = async (format: ExportFormat): Promise<void> => {
    setShowExportMenu(false);
    setExportSuccessMessage(null);
    setExportingFormat(format);

    try {
      const date = new Date().toISOString().slice(0, 10);

      if (format === "excel") {
        const headers = [
          "No.",
          "Category Name",
          "Parent Category",
          "Description",
          "Type",
        ];

        const rows = filteredCategories.map((category, index) => [
          index + 1,
          category.categoryName,
          category.parentName ?? "",
          category.description ?? "",
          category.parentId == null ? "Main Category" : "Subcategory",
        ]);

        // UTF-8 BOM is included so that Excel can properly read Myanmar/Unicode characters
        const csvContent = [
          headers.map(escapeCsv).join(","),
          ...rows.map((row) => row.map(escapeCsv).join(",")),
        ].join("\r\n");

        const blob = new Blob(["\uFEFF", csvContent], {
          type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `category-report-${date}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        setExportSuccessMessage(
          "Category report exported successfully as CSV. You can open it with Excel."
        );
      } else {
        // Backend JasperReports API ဖြင့် PDF download တိုက်ရိုက်ပြုလုပ်ခြင်း
        const response = await api.get("/reports/categories?format=pdf", {
          responseType: "blob",
        });

        const blob = new Blob([response.data], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = `category-report-${date}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);

        setExportSuccessMessage(
          "Category report exported successfully as PDF."
        );
      }
    } catch (error: unknown) {
      console.error("Export category report failed", error);
      const message =
        error instanceof Error ? error.message : "Export failed. Please check backend connection.";
      toast.error(message);
    } finally {
      setExportingFormat(null);
    }
  };

  const sortedFlatCategories = useMemo(() => {
    return [...filteredCategories].sort((a, b) => {
      // Sort in descending order by categoryId so newly created categories appear at the top
      return b.categoryId - a.categoryId;
    });
  }, [filteredCategories]);

  const renderTree = (
    nodes: CategoryResponseDto[],
    depth = 0
  ): React.ReactNode => (
    <div className={styles.treeList}>
      {nodes.map((node) => {
        const hasChildren = (node.children?.length ?? 0) > 0;
        const isExpanded =
          expanded.includes(node.categoryId) || search.trim().length > 0;

        return (
          <div key={node.categoryId} className={styles.treeItem}>
            <div
              className={styles.treeRow}
              style={{ paddingLeft: `${depth * 28 + 12}px` }}
            >
              <div className={styles.treeName}>
                {hasChildren ? (
                  <button
                    type="button"
                    className={styles.expandBtn}
                    onClick={() => onToggleExpand(node.categoryId)}
                    aria-label={
                      isExpanded ? "Collapse category" : "Expand category"
                    }
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
                  title="Edit category"
                >
                  <FiEdit2 size={12} /> Edit
                </button>

                <button
                  type="button"
                  className="table-btn-delete"
                  onClick={() => {
                    void onDelete(node.categoryId);
                  }}
                  title="Delete category"
                >
                  <FiTrash2 size={12} /> Delete
                </button>
              </div>
            </div>

            {hasChildren && isExpanded && (
              <div className={styles.treeChildren}>
                {renderTree(node.children ?? [], depth + 1)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <section className={styles.card}>
      {exportingFormat && (
        <div
          className={styles.exportProgressBanner}
          role="status"
          aria-live="polite"
        >
          <div className={styles.exportProgressSpinner} />
          <div className={styles.exportProgressContent}>
            <span className={styles.exportProgressTitle}>
              {exportingFormat === "pdf"
                ? "Preparing Category PDF Report..."
                : "Generating Excel-compatible CSV..."}
            </span>
            <span className={styles.exportProgressSubtitle}>
              Preparing your category report.
            </span>
          </div>
        </div>
      )}

      {exportSuccessMessage && (
        <div className={styles.exportSuccessToast} role="status">
          <div className={styles.exportSuccessIcon}>
            <FiCheckCircle size={20} />
          </div>
          <div className={styles.exportSuccessContent}>
            <span className={styles.exportSuccessTitle}>
              Export Completed
            </span>
            <span className={styles.exportSuccessSubtitle}>
              {exportSuccessMessage}
            </span>
          </div>
          <button
            type="button"
            className={styles.exportToastClose}
            onClick={() => setExportSuccessMessage(null)}
            title="Dismiss"
            aria-label="Dismiss export message"
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

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <FiSearch />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search categories"
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

          <div
            className={styles.exportDropdownContainer}
            ref={exportMenuRef}
          >
            <button
              type="button"
              className={`${styles.exportBtn} ${
                exportingFormat ? styles.btnActionExporting : ""
              }`}
              onClick={() => setShowExportMenu((previous) => !previous)}
              disabled={exportingFormat !== null}
              title="Export category report"
              aria-expanded={showExportMenu}
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
                  onClick={() => handleExportCategoryReport("excel")}
                >
                  <div className={styles.exportMenuIconExcel}>
                    <FiFileText size={16} />
                  </div>
                  <div className={styles.exportMenuText}>
                    <span className={styles.exportMenuTitle}>
                      Excel-compatible CSV
                    </span>
                    <span className={styles.exportMenuSub}>
                      Spreadsheet (.csv)
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className={styles.exportMenuItem}
                  onClick={() => handleExportCategoryReport("pdf")}
                >
                  <div className={styles.exportMenuIconPdf}>
                    <FiFileText size={16} />
                  </div>
                  <div className={styles.exportMenuText}>
                    <span className={styles.exportMenuTitle}>PDF Report</span>
                    <span className={styles.exportMenuSub}>
                      Direct Download (.pdf)
                    </span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.emptyState}>Loading categories...</div>
      ) : viewMode === "flat" ? (
        <div className={styles.tableWrapper}>
          <table className={`${styles.table} ${sortedFlatCategories.length > 0 ? 'table-with-data' : 'table-empty'}`}>
            <thead>
              <tr>
                <th className="text-center" style={{ width: '60px', textAlign: 'center' }}>No.</th>
                <th style={{ minWidth: '180px' }}>Category</th>
                <th style={{ minWidth: '150px' }}>Parent Category</th>
                <th>Description</th>
                <th className="text-center" style={{ width: '170px', minWidth: '170px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedFlatCategories.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
                    <FiFolder size={32} style={{ color: '#cbd5e1', marginBottom: '8px', display: 'block', margin: '0 auto 8px auto' }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>No categories found</p>
                  </td>
                </tr>
              ) : (
                sortedFlatCategories.map((category, index) => (
                <tr key={category.categoryId}>
                  <td className="text-center" style={{ textAlign: 'center' }}>
                    <span className={styles.idText}>
                      {index + 1}
                    </span>
                  </td>

                  <td>
                    <div className={styles.categoryCell}>
                      <span className={styles.categoryIcon}>
                        {category.parentId != null ? (
                          <FiGitBranch style={{ color: "#8b5cf6" }} />
                        ) : (
                          <FiFolder className="text-primary" />
                        )}
                      </span>
                      <span
                        className={
                          category.parentId == null ? "fw-bold" : ""
                        }
                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {category.categoryName}
                      </span>
                    </div>
                  </td>

                  <td>
                    {category.parentName ? (
                      <span className={styles.parentBadge}>
                        ↳ {category.parentName}
                      </span>
                    ) : (
                      <span className={styles.rootBadge}>Main Category</span>
                    )}
                  </td>

                  <td>
                    <span className={styles.descriptionText}>
                      {category.description?.trim() || "-"}
                    </span>
                  </td>

                  <td className="text-center" style={{ width: '170px', minWidth: '170px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <div className={styles.actions} style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        className="table-btn-edit"
                        onClick={() => onEdit(category)}
                        title="Edit category"
                      >
                        <FiEdit2 size={12} /> Edit
                      </button>

                      <button
                        type="button"
                        className="table-btn-delete"
                        onClick={() => {
                          void onDelete(category.categoryId);
                        }}
                        title="Delete category"
                      >
                        <FiTrash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
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