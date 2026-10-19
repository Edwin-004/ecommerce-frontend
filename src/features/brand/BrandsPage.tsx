
import { useEffect, useState, useRef } from 'react';

import {
  type Brand,
  type BrandRequest,
  type BrandStatus,
  createBrand,
  getBrands,
  updateBrand,
} from './brandApi';

import {
  BrandModal,
  type Category,
} from './BrandModels';
import {
  FiPlus,
  FiTag,
  FiCheckCircle,
  FiPauseCircle,
  FiSearch,
  FiX,
  FiInbox,
  FiEdit2,
  FiChevronLeft,
  FiChevronRight,
  FiChevronDown,
  FiChevronUp,
} from 'react-icons/fi';

import styles from './Brands.module.css';
import api from '../../utils/axiosConfig';

const API_BASE_URL = 'http://localhost:8080';
const PAGE_SIZE = 10;

const EXPORT_COLUMNS = [
  { key: 'brandName', label: 'Brand' },
  { key: 'categoryName', label: 'Category' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
];

// =====================================================
// LOGO URL
// =====================================================

const getLogoUrl = (
  logoUrl?: string | null
): string | null => {
  if (!logoUrl) return null;

  if (
    logoUrl.startsWith('http://') ||
    logoUrl.startsWith('https://')
  ) {
    return logoUrl;
  }

  return `${API_BASE_URL}${
    logoUrl.startsWith('/') ? '' : '/'
  }${logoUrl}`;
};

// =====================================================
// CATEGORY API
// =====================================================

const getCategories = async (): Promise<Category[]> => {
  const response = await fetch(
    `${API_BASE_URL}/api/backoffice/categories?page=0&size=1000&sort=categoryName,asc`
  );

  if (!response.ok) {
    throw new Error('Failed to load categories');
  }

  const data = await response.json();

  if (Array.isArray(data)) {
    return data;
  }

  return data.content ?? [];
};

// =====================================================
// PAGE
// =====================================================

export function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Search and status
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<BrandStatus | 'ALL'>('ALL');

  // Dynamic Export Column Selector state
  const [selectedExportColumns, setSelectedExportColumns] = useState<string[]>([
    'brandName',
    'categoryName',
    'description',
    'status',
  ]);
  const [showColumnDropdown, setShowColumnDropdown] = useState<boolean>(false);
  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'excel' | null>(null);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  // Sorting
  const [sortBy, setSortBy] = useState('brandName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Loading
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // =====================================================
  // LOAD CATEGORIES
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    const loadCategories = async () => {
      try {
        setCategoryLoading(true);

        const result = await getCategories();

        if (!cancelled) {
          setCategories(result);
        }
      } catch (error) {
        if (cancelled) return;

        console.error('Failed to load categories:', error);

        alert(
          error instanceof Error
            ? error.message
            : 'Failed to load categories'
        );
      } finally {
        if (!cancelled) {
          setCategoryLoading(false);
        }
      }
    };

    void loadCategories();

    return () => {
      cancelled = true;
    };
  }, []);

  // =====================================================
  // SEARCH DEBOUNCE
  // =====================================================

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  // =====================================================
  // LOAD BRANDS
  // =====================================================

  useEffect(() => {
    let cancelled = false;

    const loadBrands = async () => {
      try {
        setLoading(true);

        const result = await getBrands(
          page,
          PAGE_SIZE,
          debouncedSearch,
          status === 'ALL' ? '' : status,
          sortBy,
          sortDir
        );

        if (cancelled) return;

        setBrands(result.content);
        setTotalPages(result.totalPages);
        setTotalElements(result.totalElements);
      } catch (error) {
        if (cancelled) return;

        console.error('Failed to load brands:', error);

        alert(
          error instanceof Error
            ? error.message
            : 'Failed to load brands'
        );
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadBrands();

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, status, sortBy, sortDir]);

  // =====================================================
  // CLICK OUTSIDE TO CLOSE DROPDOWNS
  // =====================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        columnDropdownRef.current &&
        !columnDropdownRef.current.contains(event.target as Node)
      ) {
        setShowColumnDropdown(false);
      }
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setShowExportMenu(false);
      }
    };
    if (showColumnDropdown || showExportMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnDropdown, showExportMenu]);

  // =====================================================
  // AUTO-DISMISS EXPORT SUCCESS MESSAGE
  // =====================================================

  useEffect(() => {
    if (exportSuccessMessage) {
      const timer = setTimeout(() => {
        setExportSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [exportSuccessMessage]);

  // =====================================================
  // DYNAMIC COLUMN SELECTOR HANDLERS
  // =====================================================

  const handleToggleColumn = (colKey: string) => {
    setSelectedExportColumns((prev) => {
      if (prev.includes(colKey)) {
        if (prev.length <= 1) {
          alert('At least one column must be selected for export.');
          return prev;
        }
        return prev.filter((k) => k !== colKey);
      } else {
        return [...prev, colKey];
      }
    });
  };

  const handleSelectAllColumns = () => {
    setSelectedExportColumns(EXPORT_COLUMNS.map((c) => c.key));
  };

  // =====================================================
  // DYNAMIC EXPORT (PDF & EXCEL)
  // =====================================================

  const handleDynamicExport = async (format: 'pdf' | 'excel') => {
    if (selectedExportColumns.length === 0) {
      alert('Please select at least one column to export.');
      return;
    }

    setExportingFormat(format);
    setExportSuccessMessage(null);

    try {
      const params: Record<string, any> = {
        columns: selectedExportColumns.join(','),
        status: status || 'ALL',
      };
      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get(`/reports/brands/export/${format}`, {
        params,
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
      const filename = `brand_management_report_${todayStr}.${ext}`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setExportSuccessMessage(`Downloaded: ${filename} (${selectedExportColumns.length} columns)`);
    } catch (err: any) {
      console.error(`Export ${format.toUpperCase()} error:`, err);
      alert(`Failed to export ${format.toUpperCase()}. Please check your connection or login session.`);
    } finally {
      setExportingFormat(null);
    }
  };

  // =====================================================
  // SORT
  // =====================================================

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((previous) =>
        previous === 'asc' ? 'desc' : 'asc'
      );
    } else {
      setSortBy(field);
      setSortDir('asc');
    }

    setPage(0);
  };

  // =====================================================
  // SEARCH
  // =====================================================

  const handleClearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
    setPage(0);
  };

  // =====================================================
  // STATUS
  // =====================================================

  const handleStatusChange = (value: string) => {
    setStatus(value as BrandStatus | 'ALL');
    setPage(0);
  };

  // =====================================================
  // MODAL
  // =====================================================

  const openCreate = () => {
    setEditingBrand(null);
    setShowModal(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === 'true') {
      openCreate();
    }
  }, []);

  const openEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingBrand(null);
  };

  // =====================================================
  // SAVE / CREATE / UPDATE
  // =====================================================

  const handleSave = async (
    data: BrandRequest,
    file: File | null
  ) => {
    try {
      setSaving(true);

      if (editingBrand) {
        await updateBrand(
          editingBrand.brandId,
          data,
          file
        );
      } else {
        await createBrand(data, file);
      }

      setShowModal(false);
      setEditingBrand(null);

      // Refresh current page after create or edit.
      let result = await getBrands(
        page,
        PAGE_SIZE,
        debouncedSearch,
        status,
        sortBy,
        sortDir
      );

      // If the current page became empty after editing,
      // go back to the first page.
      if (result.content.length === 0 && page > 0) {
        setPage(0);
        return;
      }

      setBrands(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (error) {
      console.error('Failed to save brand:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to save brand'
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // CATEGORY NAME HELPER
  // =====================================================

  const getCategoryNames = (
    categoryIds?: number[]
  ): string[] => {
    if (!categoryIds?.length) return [];

    return categoryIds
      .map((categoryId) => {
        const category = categories.find(
          (item) => item.categoryId === categoryId
        );

        return category?.categoryName;
      })
      .filter((name): name is string => Boolean(name));
  };

  // =====================================================
  // STATS
  // =====================================================

  const activeCount = brands.filter(
    (brand) => brand.status === 'ACTIVE'
  ).length;

  const inactiveCount = brands.filter(
    (brand) => brand.status === 'INACTIVE'
  ).length;

  // =====================================================
  // SORT ICON
  // =====================================================

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) {
      return (
        <FiChevronDown size={14} className="text-muted ms-1" />
      );
    }

    return sortDir === 'asc' ? (
      <FiChevronDown size={14} className="ms-1 text-primary" />
    ) : (
      <FiChevronUp size={14} className="ms-1 text-primary" />
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className={styles.page}>
      {/* Floating Export Progress Notification */}
      {exportingFormat && (
        <div className={styles.exportProgressBanner}>
          <div className={styles.exportProgressSpinner} />
          <div className={styles.exportProgressContent}>
            <div className={styles.exportProgressTitle}>
              Exporting Brand Report ({exportingFormat.toUpperCase()})...
            </div>
            <div className={styles.exportProgressSub}>
              Generating report with {selectedExportColumns.length} selected column(s)
            </div>
          </div>
        </div>
      )}

      {/* Floating Export Success Notification */}
      {exportSuccessMessage && (
        <div className={styles.exportSuccessBanner}>
          <div className={styles.exportSuccessIcon}>
            <i className="bi bi-check-lg" />
          </div>
          <div className={styles.exportSuccessContent}>
            <div className={styles.exportSuccessTitle}>Export Successful</div>
            <div className={styles.exportSuccessSub}>{exportSuccessMessage}</div>
          </div>
          <button
            type="button"
            className={styles.exportCloseBtn}
            onClick={() => setExportSuccessMessage(null)}
            title="Dismiss"
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>
      )}

      <div className="container-fluid px-4 py-4">

        {/* HEADER */}

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">
              Brand Management
            </h2>

            <p className="text-secondary mb-0">
              Manage your product brands and brand logos.
            </p>
          </div>

          <button
            className="btn btn-primary px-4 py-2"
            onClick={openCreate}
            disabled={loading || categoryLoading || saving}
          >
            <FiPlus size={16} className="me-2" />
            Add Brand
          </button>
        </div>

        {/* STATS */}

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className={`${styles.statCard} card border-0 shadow-sm`}>
              <div className="card-body d-flex align-items-center">
                <div className={`${styles.statIcon} ${styles.purple}`}>
                  <FiTag size={20} />
                </div>

                <div>
                  <small className="text-secondary">
                    Total Brands
                  </small>

                  <h3 className="fw-bold mb-0">
                    {totalElements}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className={`${styles.statCard} card border-0 shadow-sm`}>
              <div className="card-body d-flex align-items-center">
                <div className={`${styles.statIcon} ${styles.green}`}>
                  <FiCheckCircle size={20} />
                </div>

                <div>
                  <small className="text-secondary">
                    Active
                  </small>

                  <h3 className="fw-bold mb-0">
                    {activeCount}
                  </h3>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className={`${styles.statCard} card border-0 shadow-sm`}>
              <div className="card-body d-flex align-items-center">
                <div className={`${styles.statIcon} ${styles.orange}`}>
                  <FiPauseCircle size={20} />
                </div>

                <div>
                  <small className="text-secondary">
                    Inactive
                  </small>

                  <h3 className="fw-bold mb-0">
                    {inactiveCount}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TABLE CARD */}

        <div className="card border-0 shadow-sm">

          {/* TOOLBAR */}

          <div className="card-header bg-white border-0 p-3">
            <div className="row g-2 align-items-center">
              <div className="col-md">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <FiSearch size={15} />
                  </span>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search brand, category or description..."
                    value={search}
                    onChange={(event) =>
                      setSearch(event.target.value)
                    }
                  />

                  {search && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleClearSearch}
                      aria-label="Clear search"
                    >
                      <FiX size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="col-md-auto">
                <select
                  className="form-select"
                  value={status}
                  onChange={(event) =>
                    handleStatusChange(event.target.value)
                  }
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              {/* Column Selector Popover */}
              <div className="col-md-auto">
                <div className={styles.columnSelectorContainer} ref={columnDropdownRef}>
                  <button
                    type="button"
                    className={styles.btnActionItem}
                    onClick={() => setShowColumnDropdown((prev) => !prev)}
                    title="Select columns to export"
                  >
                    <i className="bi bi-sliders text-secondary" />
                    <span>Columns ({selectedExportColumns.length}/4)</span>
                  </button>

                  {showColumnDropdown && (
                    <div className={styles.columnDropdownMenu}>
                      <div className={styles.columnDropdownHeader}>
                        <span className={styles.columnDropdownTitle}>Export Columns</span>
                        <button
                          type="button"
                          className={styles.columnDropdownAction}
                          onClick={handleSelectAllColumns}
                        >
                          Select All
                        </button>
                      </div>

                      <div className={styles.columnCheckboxList}>
                        {EXPORT_COLUMNS.map((col) => (
                          <label key={col.key} className={styles.columnCheckboxLabel}>
                            <input
                              type="checkbox"
                              checked={selectedExportColumns.includes(col.key)}
                              onChange={() => handleToggleColumn(col.key)}
                            />
                            <span>{col.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Export Dropdown Menu */}
              <div className="col-md-auto">
                <div className={styles.exportDropdownContainer} ref={exportMenuRef}>
                  <button
                    type="button"
                    className={`${styles.btnActionItem} ${exportingFormat ? styles.btnActionExporting : ''}`}
                    onClick={() => setShowExportMenu((prev) => !prev)}
                    disabled={!!exportingFormat}
                    title="Export filtered brands as PDF or Excel"
                  >
                    {exportingFormat ? (
                      <>
                        <span className={styles.exportSpinner} />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <i className="bi bi-download text-primary" />
                        <span>Export</span>
                        <i className="bi bi-chevron-down text-muted small" />
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
                          void handleDynamicExport('excel');
                        }}
                      >
                        <div className={styles.exportMenuIconExcel}>
                          <i className="bi bi-file-earmark-excel fs-5" />
                        </div>
                        <div className={styles.exportMenuText}>
                          <span className={styles.exportMenuTitle}>Excel Spreadsheet</span>
                          <span className={styles.exportMenuSub}>.xlsx format</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        className={styles.exportMenuItem}
                        onClick={() => {
                          setShowExportMenu(false);
                          void handleDynamicExport('pdf');
                        }}
                      >
                        <div className={styles.exportMenuIconPdf}>
                          <i className="bi bi-file-earmark-pdf fs-5" />
                        </div>
                        <div className={styles.exportMenuText}>
                          <span className={styles.exportMenuTitle}>PDF Document</span>
                          <span className={styles.exportMenuSub}>Standard PDF report</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* TABLE */}

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th className="ps-4" style={{ width: '60px' }}>
                    #
                  </th>

                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('brandName')}
                  >
                    Brand
                    {renderSortIcon('brandName')}
                  </th>

                  <th>Category</th>

                  <th>Description</th>

                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('status')}
                  >
                    Status
                    {renderSortIcon('status')}
                  </th>

                  <th className="text-end px-4">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <div className="spinner-border text-primary" />

                      <div className="text-secondary mt-2">
                        Loading brands...
                      </div>
                    </td>
                  </tr>
                ) : brands.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-5">
                      <FiInbox size={36} className="text-secondary" />

                      <h6 className="mt-3">
                        No brands found
                      </h6>

                      <p className="text-secondary small mb-0">
                        {debouncedSearch
                          ? 'Try another search keyword.'
                          : 'Create a new brand to get started.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  brands.map((brand, index) => {
                    const logoUrl = getLogoUrl(brand.brandLogoUrl);

                    const rowNumber = page * PAGE_SIZE + index + 1;

                    const categoryNames = getCategoryNames(
                      brand.categoryIds
                    );

                    return (
                      <tr key={brand.brandId}>
                        {/* NUMBER */}

                        <td className="ps-4 fw-medium text-secondary">
                          {rowNumber}
                        </td>

                        {/* BRAND */}

                        <td>
                          <div className="d-flex align-items-center gap-3">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={brand.brandName}
                                className={styles.logo}
                                onError={(event) => {
                                  event.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className={styles.logoPlaceholder}>
                                {brand.brandName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>
                            )}

                            <div className="fw-semibold">
                              {brand.brandName}
                            </div>
                          </div>
                        </td>

                        {/* CATEGORY */}

                        <td>
                          {categoryNames.length > 0 ? (
                            <div className="d-flex flex-wrap gap-1">
                              {categoryNames.map((name) => (
                                <span
                                  key={name}
                                  className="badge text-bg-light border"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-secondary">
                              No category
                            </span>
                          )}
                        </td>

                        {/* DESCRIPTION */}

                        <td>
                          <span className="text-secondary">
                            {brand.description || 'No description'}
                          </span>
                        </td>

                        {/* STATUS */}

                        <td>
                          {brand.status === 'ACTIVE' ? (
                            <span className="badge rounded-pill text-bg-success">
                              <FiCheckCircle size={12} className="me-1" />
                              Active
                            </span>
                          ) : (
                            <span className="badge rounded-pill text-bg-secondary">
                              <FiPauseCircle size={12} className="me-1" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td className="text-end px-4">
                          <button
                            type="button"
                            className="table-btn-edit"
                            onClick={() => openEdit(brand)}
                            title="Edit Brand"
                            aria-label={`Edit ${brand.brandName}`}
                            disabled={saving}
                          >
                            <FiEdit2 size={12} /> Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}

          {totalPages > 0 && (
            <div className="card-footer bg-white border-0 d-flex justify-content-between align-items-center">
              <small className="text-secondary">
                Page {page + 1} of {totalPages}
              </small>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page === 0 || loading}
                  onClick={() =>
                    setPage((previous) => previous - 1)
                  }
                  aria-label="Previous page"
                >
                  <FiChevronLeft size={16} />
                </button>

                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page >= totalPages - 1 || loading}
                  onClick={() =>
                    setPage((previous) => previous + 1)
                  }
                  aria-label="Next page"
                >
                  <FiChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}

      <BrandModal
        show={showModal}
        brand={editingBrand}
        loading={saving || categoryLoading}
        categories={categories}
        onClose={closeModal}
        onSubmit={handleSave}
      />
    </div>
  );
}

