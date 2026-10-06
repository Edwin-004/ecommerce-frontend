import {
  useEffect,
  useState,
} from 'react';

import {
  type Brand,
  type BrandRequest,
  type BrandStatus,
  createBrand,
  deleteBrand,
  getBrands,
  updateBrand,
} from './brandApi';

import { BrandModal } from './BrandModels';

import styles from './Brands.module.css';

// =====================================================
// BACKEND URL
// =====================================================

const API_BASE_URL = 'http://localhost:8080';

// =====================================================
// LOGO URL HELPER
// =====================================================

const getLogoUrl = (
  logoUrl?: string | null
): string | null => {
  if (!logoUrl) {
    return null;
  }

  // Already full URL
  if (
    logoUrl.startsWith('http://') ||
    logoUrl.startsWith('https://')
  ) {
    return logoUrl;
  }

  // Relative DB URL
  // Example:
  // /uploads/brand-logos/xxx.jpg
  //
  // Result:
  // http://localhost:8080/uploads/brand-logos/xxx.jpg

  return `${API_BASE_URL}${
    logoUrl.startsWith('/') ? '' : '/'
  }${logoUrl}`;
};

// =====================================================
// PAGE
// =====================================================

export function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);

  const [page, setPage] = useState(0);

  const [totalPages, setTotalPages] = useState(0);

  const [totalElements, setTotalElements] = useState(0);

  const [search, setSearch] = useState('');

  const [status, setStatus] =
    useState<BrandStatus | ''>('');

  const [loading, setLoading] = useState(false);

  const [saving, setSaving] = useState(false);

  const [showModal, setShowModal] = useState(false);

  const [editingBrand, setEditingBrand] =
    useState<Brand | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<Brand | null>(null);

  // =====================================================
  // LOAD BRANDS
  // =====================================================

  const loadBrands = async () => {
    try {
      setLoading(true);

      const result = await getBrands(
        page,
        10,
        search.trim(),
        status
      );

      setBrands(result.content);

      setTotalPages(result.totalPages);

      setTotalElements(result.totalElements);
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to load brands'
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // LOAD WHEN PAGE / SEARCH / STATUS CHANGES
  // =====================================================

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBrands();
    }, 300);

    return () => clearTimeout(timer);
  }, [page, search, status]);

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearchChange = (
    value: string
  ) => {
    setSearch(value);

    // Search အသစ်စတဲ့အခါ page 1 ပြန်သွားမယ်
    setPage(0);
  };

  // =====================================================
  // STATUS
  // =====================================================

  const handleStatusChange = (
    value: string
  ) => {
    setStatus(
      value as BrandStatus | ''
    );

    // Filter ပြောင်းတဲ့အခါ page 1 ပြန်သွားမယ်
    setPage(0);
  };

  // =====================================================
  // CREATE
  // =====================================================

  const openCreate = () => {
    setEditingBrand(null);
    setShowModal(true);
  };

  // =====================================================
  // EDIT
  // =====================================================

  const openEdit = (
    brand: Brand
  ) => {
    setEditingBrand(brand);
    setShowModal(true);
  };

  // =====================================================
  // SAVE
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
        await createBrand(
          data,
          file
        );
      }

      setShowModal(false);
      setEditingBrand(null);

      await loadBrands();
    } catch (error) {
      console.error(error);

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
  // DELETE
  // =====================================================

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      setLoading(true);

      await deleteBrand(
        deleteTarget.brandId
      );

      setDeleteTarget(null);

      await loadBrands();
    } catch (error) {
      console.error(error);

      alert(
        error instanceof Error
          ? error.message
          : 'Failed to delete brand'
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // STATS
  // =====================================================

  const activeCount =
    brands.filter(
      (brand) =>
        brand.status === 'ACTIVE'
    ).length;

  const inactiveCount =
    brands.filter(
      (brand) =>
        brand.status === 'INACTIVE'
    ).length;

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className={styles.page}>

      <div className="container-fluid px-4 py-4">

        {/* ======================
            HEADER
        ======================= */}

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
          >
            <i className="bi bi-plus-lg me-2" />
            Add Brand
          </button>

        </div>

        {/* ======================
            STATS
        ======================= */}

        <div className="row g-3 mb-4">

          {/* TOTAL */}

          <div className="col-md-4">

            <div
              className={`${styles.statCard} card border-0 shadow-sm`}
            >

              <div className="card-body d-flex align-items-center">

                <div
                  className={`${styles.statIcon} ${styles.purple}`}
                >
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

          {/* ACTIVE */}

          <div className="col-md-4">

            <div
              className={`${styles.statCard} card border-0 shadow-sm`}
            >

              <div className="card-body d-flex align-items-center">

                <div
                  className={`${styles.statIcon} ${styles.green}`}
                >
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

          {/* INACTIVE */}

          <div className="col-md-4">

            <div
              className={`${styles.statCard} card border-0 shadow-sm`}
            >

              <div className="card-body d-flex align-items-center">

                <div
                  className={`${styles.statIcon} ${styles.orange}`}
                >
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

        {/* ======================
            TABLE
        ======================= */}

        <div className="card border-0 shadow-sm">

          {/* TOOLBAR */}

          <div className="card-header bg-white border-0 p-3">

            <div className="row g-2">

              {/* SEARCH */}

              <div className="col-md">

                <div className="input-group">

                  <span className="input-group-text bg-white">
                    <i className="bi bi-search" />
                  </span>

                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search brand..."
                    value={search}
                    onChange={(e) =>
                      handleSearchChange(
                        e.target.value
                      )
                    }
                  />

                  {search && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        setSearch('');
                        setPage(0);
                      }}
                    >
                      <i className="bi bi-x-lg" />
                    </button>
                  )}

                </div>

              </div>

              {/* STATUS */}

              <div className="col-md-auto">

                <select
                  className="form-select"
                  value={status}
                  onChange={(e) =>
                    handleStatusChange(
                      e.target.value
                    )
                  }
                >

                  <option value="">
                    All Status
                  </option>

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="INACTIVE">
                    Inactive
                  </option>

                </select>

              </div>

            </div>

          </div>

          {/* TABLE */}

          <div className="table-responsive">

            <table className="table table-hover align-middle mb-0">

              <thead className="table-light">

                <tr>

                  <th className="px-4">
                    Brand
                  </th>

                  <th>
                    Description
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Created
                  </th>

                  <th className="text-end px-4">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td
                      colSpan={5}
                      className="text-center py-5"
                    >

                      <div className="spinner-border text-primary" />

                      <div className="text-secondary mt-2">
                        Loading brands...
                      </div>

                    </td>

                  </tr>

                ) : brands.length === 0 ? (

                  <tr>

                    <td
                      colSpan={5}
                      className="text-center py-5"
                    >

                      <i className="bi bi-inbox fs-1 text-secondary" />

                      <h6 className="mt-3">
                        No brands found
                      </h6>

                      <p className="text-secondary small mb-0">
                        {search
                          ? 'Try another search keyword.'
                          : 'Create a new brand to get started.'}
                      </p>

                    </td>

                  </tr>

                ) : (

                  brands.map(
                    (brand) => {

                      // Convert DB relative URL
                      // into backend URL

                      const logoUrl =
                        getLogoUrl(
                          brand.brandLogoUrl
                        );

                      return (
                        <tr
                          key={brand.brandId}
                        >

                          {/* BRAND */}

                          <td className="px-4">

                            <div className="d-flex align-items-center gap-3">

                              {logoUrl ? (

                                <img
                                  src={logoUrl}
                                  alt={brand.brandName}
                                  className={styles.logo}
                                  onError={(e) => {
                                    e.currentTarget.style.display =
                                      'none';
                                  }}
                                />

                              ) : (

                                <div
                                  className={
                                    styles.logoPlaceholder
                                  }
                                >
                                  {brand.brandName
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>

                              )}

                              <div>

                                <div className="fw-semibold">
                                  {brand.brandName}
                                </div>

                                <small className="text-secondary">
                                  ID #{brand.brandId}
                                </small>

                              </div>

                            </div>

                          </td>

                          {/* DESCRIPTION */}

                          <td>

                            <span className="text-secondary">

                              {brand.description ||
                                'No description'}

                            </span>

                          </td>

                          {/* STATUS */}

                          <td>

                            {brand.status ===
                            'ACTIVE' ? (

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

                          {/* CREATED */}

                          <td>

                            <span className="text-secondary">

                              {new Date(
                                brand.createdAt
                              ).toLocaleDateString()}

                            </span>

                          </td>

                          {/* ACTIONS */}

                          <td className="text-end px-4">

                            <button
                              className="btn btn-sm btn-light me-2"
                              onClick={() =>
                                openEdit(
                                  brand
                                )
                              }
                              title="Edit"
                            >
                              <i className="bi bi-pencil" />
                            </button>

                            <button
                              className="btn btn-sm btn-light text-danger"
                              onClick={() =>
                                setDeleteTarget(
                                  brand
                                )
                              }
                              title="Delete"
                            >
                              <i className="bi bi-trash" />
                            </button>

                          </td>

                        </tr>
                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>

          {/* ======================
              PAGINATION
          ======================= */}

          {totalPages > 0 && (

            <div className="card-footer bg-white border-0 d-flex justify-content-between align-items-center">

              <small className="text-secondary">

                Page {page + 1} of {totalPages}

              </small>

              <div className="d-flex gap-2">

                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={
                    page === 0 ||
                    loading
                  }
                  onClick={() =>
                    setPage(
                      (prev) =>
                        prev - 1
                    )
                  }
                >
                  <i className="bi bi-chevron-left" />
                </button>

                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={
                    page >=
                      totalPages - 1 ||
                    loading
                  }
                  onClick={() =>
                    setPage(
                      (prev) =>
                        prev + 1
                    )
                  }
                >
                  <i className="bi bi-chevron-right" />
                </button>

              </div>

            </div>

          )}

        </div>

      </div>

      {/* ======================
          CREATE / EDIT MODAL
      ======================= */}

      <BrandModal
        show={showModal}
        brand={editingBrand}
        loading={saving}
        onClose={() => {
          setShowModal(false);
          setEditingBrand(null);
        }}
        onSubmit={handleSave}
      />

      {/* ======================
          DELETE MODAL
      ======================= */}

      {deleteTarget && (

        <div
          className="modal d-block"
          style={{
            backgroundColor:
              'rgba(15,23,42,.55)',
          }}
        >

          <div className="modal-dialog modal-dialog-centered">

            <div className="modal-content border-0 shadow-lg rounded-4">

              <div className="modal-body text-center p-4">

                <div
                  className="mx-auto mb-3 rounded-circle bg-danger-subtle text-danger d-flex align-items-center justify-content-center"
                  style={{
                    width: 64,
                    height: 64,
                  }}
                >
                  <i className="bi bi-trash fs-3" />
                </div>

                <h5 className="fw-bold">
                  Delete Brand?
                </h5>

                <p className="text-secondary">

                  Are you sure you want to delete{' '}

                  <strong>
                    {deleteTarget.brandName}
                  </strong>

                  ?

                  <br />

                  This action cannot be undone.

                </p>

                <div className="d-flex justify-content-center gap-2 mt-4">

                  <button
                    className="btn btn-light px-4"
                    onClick={() =>
                      setDeleteTarget(
                        null
                      )
                    }
                  >
                    Cancel
                  </button>

                  <button
                    className="btn btn-danger px-4"
                    onClick={
                      handleDelete
                    }
                    disabled={loading}
                  >

                    {loading ? (

                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                        />
                        Deleting...
                      </>

                    ) : (

                      <>
                        <i className="bi bi-trash me-2" />
                        Delete
                      </>

                    )}

                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}