
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

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
import api, { API_BASE_URL } from '../../utils/axiosConfig';


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
  const res = await api.get<any>('/categories?page=0&size=1000&sort=categoryName,asc');
  const response = res.data;

  if (Array.isArray(response)) {
    return response;
  }

  return response.content ?? [];
};

// =====================================================
// PAGE
// =====================================================

export function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // Pagination
  const [searchParams, setSearchParams] = useSearchParams();

  const paramPage = Number(searchParams.get('page')) || 0;
  const paramStatus = (searchParams.get('status') as BrandStatus | 'ALL') || 'ALL';
  const paramSearch = searchParams.get('search') || '';

  const [page, setPageState] = useState(paramPage);
  const [search, setSearchState] = useState(paramSearch);
  const [status, setStatusState] = useState<BrandStatus | 'ALL'>(paramStatus);

  const updateBrandParams = (updates: { page?: number; status?: BrandStatus | 'ALL'; search?: string }) => {
    const next = new URLSearchParams(searchParams);
    const nextStatus = updates.status !== undefined ? updates.status : status;
    const nextSearch = updates.search !== undefined ? updates.search : search;
    const nextPage = updates.page !== undefined ? updates.page : 0;

    if (nextStatus && nextStatus !== 'ALL') next.set('status', nextStatus); else next.delete('status');
    if (nextSearch && nextSearch.trim()) next.set('search', nextSearch.trim()); else next.delete('search');
    if (nextPage > 0) next.set('page', String(nextPage)); else next.delete('page');

    setSearchParams(next, { replace: true });
  };

  const setPage = (p: number) => {
    setPageState(p);
    updateBrandParams({ page: p });
  };

  const setSearch = (s: string) => {
    setSearchState(s);
    updateBrandParams({ search: s, page: 0 });
  };

  const setStatus = (st: BrandStatus | 'ALL') => {
    setStatusState(st);
    updateBrandParams({ status: st, page: 0 });
  };

  useEffect(() => {
    setStatusState((searchParams.get('status') as BrandStatus | 'ALL') || 'ALL');
    setSearchState(searchParams.get('search') || '');
    setPageState(Number(searchParams.get('page')) || 0);
  }, [searchParams]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Search and status

  const [debouncedSearch, setDebouncedSearch] = useState('');


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
      if (search && search.trim().length > 100) {
        alert('Search query cannot exceed 100 characters for export.');
        setExportingFormat(null);
        return;
      }

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


      let result = await getBrands(
        page,
        PAGE_SIZE,
        debouncedSearch,
        status,
        sortBy,
        sortDir
      );

      if (result.content.length === 0 && page > 0) {
        setPage(0);
        return;
      }

      setBrands(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (error) {
      console.error('Failed to save brand:', error);
      
      throw error;
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
    <div className={styles.container}>
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

      {/* HEADER */}
      <div className={styles.headerRow}>
        <div className={styles.headerLeft}>
          <div>
            <h1 className={`${styles.pageTitle} text-xl font-semibold text-slate-900 tracking-tight`}>Brand Management</h1>
            <p className={`${styles.pageSubtitle} text-xs text-slate-500`}>
              Manage your product brands and brand logos.
            </p>
          </div>
        </div>

        <button
          className={styles.primaryAddBtn}
          onClick={openCreate}
          disabled={loading || categoryLoading || saving}
        >
          <FiPlus size={16} />
          Add Brand
        </button>
      </div>

      {/* STATS */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Total brands</span>
            <h3 className={styles.statValue}>{totalElements}</h3>
          </div>
          <div className={`${styles.statIconBox} ${styles.purple}`}>
            <FiTag size={20} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Active</span>
            <h3 className={styles.statValue}>{activeCount}</h3>
          </div>
          <div className={`${styles.statIconBox} ${styles.green}`}>
            <FiCheckCircle size={20} />
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Inactive</span>
            <h3 className={styles.statValue}>{inactiveCount}</h3>
          </div>
          <div className={`${styles.statIconBox} ${styles.orange}`}>
            <FiPauseCircle size={20} />
          </div>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className={styles.filterCard}>
        <div className={styles.searchWrapper}>
          <FiSearch size={15} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search brand, category or description..."
            maxLength={100}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          {search && (
            <button
              type="button"
              className={styles.clearBtn}
              onClick={handleClearSearch}
              aria-label="Clear search"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        <div className={styles.filterActions}>
          <select
            className={styles.statusSelect}
            value={status}
            onChange={(event) => handleStatusChange(event.target.value)}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {/* Column Selector Popover */}
          <div className={styles.columnSelectorContainer} ref={columnDropdownRef}>
            <button
              type="button"
              className={styles.btnActionItem}
              onClick={() => setShowColumnDropdown((prev) => !prev)}
              title="Select columns to export"
            >
              <i className="bi bi-sliders" style={{ color: '#64748b' }} />
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

          {/* Export Dropdown Menu */}
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
                  <i className="bi bi-download" style={{ color: '#2563eb' }} />
                  <span>Export</span>
                  <i className="bi bi-chevron-down" style={{ color: '#94a3b8', fontSize: '11px' }} />
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

      {/* TABLE CARD */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={`${styles.brandsTable} ${brands.length > 0 ? 'table-with-data' : 'table-empty'}`}>
            <thead>
              <tr>
                <th className="text-center" style={{ width: '60px', textAlign: 'center' }}>No.</th>
                <th
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('brandName')}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>Brand</span>
                    {renderSortIcon('brandName')}
                  </div>
                </th>
                <th>Category</th>
                <th>Description</th>
                <th
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSort('status')}
                >
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th className="text-right" style={{ textAlign: 'right', paddingRight: '20px' }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '64px 20px', textAlign: 'center' }}>
                    <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} />
                    <div style={{ marginTop: '12px', fontSize: '13.5px', color: '#64748b', fontWeight: 500 }}>
                      Loading brands...
                    </div>
                  </td>
                </tr>
              ) : brands.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '0', border: 'none' }}>
                    <div className={styles.emptyContainer}>
                      <div className={styles.emptyIconCircle}>
                        <FiInbox />
                      </div>
                      <h3 className={styles.emptyTitle}>No brands found</h3>
                      <p className={styles.emptySubtitle}>
                        {debouncedSearch
                          ? 'No brands matched your search. Try another keyword or clear filters.'
                          : 'There are no brands registered yet. Create your first brand to get started.'}
                      </p>
                      {!debouncedSearch && (
                        <button
                          type="button"
                          className={styles.emptyActionBtn}
                          onClick={openCreate}
                          disabled={loading || categoryLoading || saving}
                        >
                          <FiPlus size={15} /> Add New Brand
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                brands.map((brand, index) => {
                  const logoUrl = getLogoUrl(brand.brandLogoUrl);
                  const rowNumber = page * PAGE_SIZE + index + 1;
                  const categoryNames = getCategoryNames(brand.categoryIds);

                  return (
                    <tr key={brand.brandId}>
                      <td className="text-center" style={{ fontWeight: 600, color: '#64748b', textAlign: 'center' }}>
                        {rowNumber}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                              {brand.brandName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div style={{ fontWeight: 600, color: '#0f172a' }}>
                            {brand.brandName}
                          </div>
                        </div>
                      </td>

                      <td>
                        {categoryNames.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {categoryNames.map((name) => (
                              <span key={name} className={styles.categoryBadge}>
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '13px' }}>
                            No category
                          </span>
                        )}
                      </td>

                      <td>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>
                          {brand.description || '—'}
                        </span>
                      </td>

                      <td>
                        {brand.status === 'ACTIVE' ? (
                          <span className={styles.statusActive}>
                            <FiCheckCircle size={12} />
                            Active
                          </span>
                        ) : (
                          <span className={styles.statusInactive}>
                            <FiPauseCircle size={12} />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="text-right" style={{ textAlign: 'right', paddingRight: '20px' }}>
                        <button
                          type="button"
                          className="table-btn-edit"
                          onClick={() => openEdit(brand)}
                          title="Edit Brand"
                          aria-label={`Edit ${brand.brandName}`}
                          disabled={saving}
                        >
                          <FiEdit2 size={12} />
                          <span>Edit</span>
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
          <div className={styles.tableFooter}>
            <div>
              Showing page <strong style={{ color: '#0f172a' }}>{page + 1}</strong> of <strong style={{ color: '#0f172a' }}>{totalPages}</strong> ({totalElements} total brands)
            </div>

            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.pageBtn}
                disabled={page === 0 || loading}
                onClick={() => setPage((previous) => previous - 1)}
                aria-label="Previous page"
              >
                <FiChevronLeft size={16} />
              </button>

              <button
                type="button"
                className={styles.pageBtn}
                disabled={page >= totalPages - 1 || loading}
                onClick={() => setPage((previous) => previous + 1)}
                aria-label="Next page"
              >
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
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