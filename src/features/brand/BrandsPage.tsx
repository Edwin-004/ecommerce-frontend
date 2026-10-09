
import { useEffect, useState } from 'react';

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

import styles from './Brands.module.css';

const API_BASE_URL = 'http://localhost:8080';
const PAGE_SIZE = 10;

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
  const [status, setStatus] = useState<BrandStatus | ''>('');

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
          status,
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
    setStatus(value as BrandStatus | '');
    setPage(0);
  };

  // =====================================================
  // MODAL
  // =====================================================

  const openCreate = () => {
    setEditingBrand(null);
    setShowModal(true);
  };

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
        <i className="bi bi-arrow-down-up text-muted ms-1 small" />
      );
    }

    return sortDir === 'asc' ? (
      <i className="bi bi-sort-alpha-down ms-1 text-primary" />
    ) : (
      <i className="bi bi-sort-alpha-up-alt ms-1 text-primary" />
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className={styles.page}>
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
            <i className="bi bi-plus-lg me-2" />
            Add Brand
          </button>
        </div>

        {/* STATS */}

        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className={`${styles.statCard} card border-0 shadow-sm`}>
              <div className="card-body d-flex align-items-center">
                <div className={`${styles.statIcon} ${styles.purple}`}>
                  <i className="bi bi-tags" />
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
                  <i className="bi bi-check-circle" />
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
                  <i className="bi bi-pause-circle" />
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
            <div className="row g-2">
              <div className="col-md">
                <div className="input-group">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search" />
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
                      <i className="bi bi-x-lg" />
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
                  <option value="">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
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
                      <i className="bi bi-inbox fs-1 text-secondary" />

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
                              <i className="bi bi-check-circle me-1" />
                              Active
                            </span>
                          ) : (
                            <span className="badge rounded-pill text-bg-secondary">
                              <i className="bi bi-pause-circle me-1" />
                              Inactive
                            </span>
                          )}
                        </td>

                        {/* ACTIONS */}

                        <td className="text-end px-4">
                          <button
                            className="btn btn-sm btn-light"
                            onClick={() => openEdit(brand)}
                            title="Edit"
                            aria-label={`Edit ${brand.brandName}`}
                            disabled={saving}
                          >
                            <i className="bi bi-pencil" />
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
                  <i className="bi bi-chevron-left" />
                </button>

                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page >= totalPages - 1 || loading}
                  onClick={() =>
                    setPage((previous) => previous + 1)
                  }
                  aria-label="Next page"
                >
                  <i className="bi bi-chevron-right" />
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

