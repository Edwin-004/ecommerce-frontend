import { useEffect, useState } from 'react';
import {
  type Brand,
  type BrandRequest,
  type BrandStatus,
  createBrand,
  getBrands,
  updateBrand,
} from './brandApi';
import { BrandModal } from './BrandModels';
import styles from './Brands.module.css';

const API_BASE_URL = 'http://localhost:8080';

const getLogoUrl = (logoUrl?: string | null): string | null => {
  if (!logoUrl) return null;
  if (logoUrl.startsWith('http://') || logoUrl.startsWith('https://')) {
    return logoUrl;
  }
  return `${API_BASE_URL}${logoUrl.startsWith('/') ? '' : '/'}${logoUrl}`;
};

export function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);

  // PAGINATION
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // SEARCH & STATUS
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<BrandStatus | ''>('');

  // SORTING STATE
  const [sortBy, setSortBy] = useState('brandName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // LOADING & MODAL
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  // SEARCH DEBOUNCE
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(0);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [search]);

  // LOAD BRANDS FROM BACKEND
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
          error instanceof Error ? error.message : 'Failed to load brands'
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadBrands();

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, status, sortBy, sortDir]);

  // SORT TOGGLE HANDLER
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(0);
  };

  const handleSearchChange = (value: string) => setSearch(value);
  const handleClearSearch = () => {
    setSearch('');
    setDebouncedSearch('');
    setPage(0);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value as BrandStatus | '');
    setPage(0);
  };

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

  const handleSave = async (data: BrandRequest, file: File | null) => {
    try {
      setSaving(true);
      if (editingBrand) {
        await updateBrand(editingBrand.brandId, data, file);
      } else {
        await createBrand(data, file);
      }

      setShowModal(false);
      setEditingBrand(null);

      const result = await getBrands(
        page,
        PAGE_SIZE,
        debouncedSearch,
        status,
        sortBy,
        sortDir
      );

      setBrands(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (error) {
      console.error('Failed to save brand:', error);
      alert(error instanceof Error ? error.message : 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = brands.filter((b) => b.status === 'ACTIVE').length;
  const inactiveCount = brands.filter((b) => b.status === 'INACTIVE').length;

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return <i className="bi bi-arrow-down-up text-muted ms-1 small" />;
    return sortDir === 'asc' ? (
      <i className="bi bi-sort-alpha-down ms-1 text-primary" />
    ) : (
      <i className="bi bi-sort-alpha-up-alt ms-1 text-primary" />
    );
  };

  return (
    <div className={styles.page}>
      <div className="container-fluid px-4 py-4">
        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="fw-bold mb-1">Brand Management</h2>
            <p className="text-secondary mb-0">
              Manage your product brands and brand logos.
            </p>
          </div>
          <button
            className="btn btn-primary px-4 py-2"
            onClick={openCreate}
            disabled={loading}
          >
            <i className="bi bi-plus-lg me-2" /> Add Brand
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
                  <small className="text-secondary">Total Brands</small>
                  <h3 className="fw-bold mb-0">{totalElements}</h3>
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
                  <small className="text-secondary">Active</small>
                  <h3 className="fw-bold mb-0">{activeCount}</h3>
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
                  <small className="text-secondary">Inactive</small>
                  <h3 className="fw-bold mb-0">{inactiveCount}</h3>
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
                    placeholder="Search brand name or description..."
                    value={search}
                    onChange={(e) => handleSearchChange(e.target.value)}
                  />
                  {search && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleClearSearch}
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
                  onChange={(e) => handleStatusChange(e.target.value)}
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

                  {/* SORTABLE HEADERS */}
                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('brandName')}
                  >
                    Brand {renderSortIcon('brandName')}
                  </th>

                  <th>Description</th>

                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('status')}
                  >
                    Status {renderSortIcon('status')}
                  </th>

                  <th
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleSort('createdAt')}
                  >
                    Created {renderSortIcon('createdAt')}
                  </th>

                  <th className="text-end px-4">Actions</th>
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
                      <h6 className="mt-3">No brands found</h6>
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

                    return (
                      <tr key={brand.brandId}>
                        <td className="ps-4 fw-medium text-secondary">
                          {rowNumber}
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={brand.brandName}
                                className={styles.logo}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className={styles.logoPlaceholder}>
                                {brand.brandName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="fw-semibold">
                                {brand.brandName}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <span className="text-secondary">
                            {brand.description || 'No description'}
                          </span>
                        </td>

                        <td>
                          {brand.status === 'ACTIVE' ? (
                            <span className="badge rounded-pill text-bg-success">
                              <i className="bi bi-check-circle me-1" /> Active
                            </span>
                          ) : (
                            <span className="badge rounded-pill text-bg-secondary">
                              <i className="bi bi-pause-circle me-1" /> Inactive
                            </span>
                          )}
                        </td>

                        <td>
                          <span className="text-secondary">
                            {new Date(brand.createdAt).toLocaleDateString()}
                          </span>
                        </td>

                        <td className="text-end px-4">
                          <button
                            className="btn btn-sm btn-light"
                            onClick={() => openEdit(brand)}
                            title="Edit"
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
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  <i className="bi bi-chevron-left" />
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={page >= totalPages - 1 || loading}
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  <i className="bi bi-chevron-right" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      <BrandModal
        show={showModal}
        brand={editingBrand}
        loading={saving}
        onClose={closeModal}
        onSubmit={handleSave}
      />
    </div>
  );
}