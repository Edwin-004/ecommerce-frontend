
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  type Brand,
  type BrandRequest,
  type BrandStatus,
} from './brandApi';

const API_BASE_URL = 'http://localhost:8080';

export interface Category {
  categoryId: number;
  categoryName: string;
  parentId?: number | null;
  parentName?: string | null;
}

const getLogoUrl = (
  logoUrl?: string | null
): string => {
  if (!logoUrl) return '';

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

interface BrandModalProps {
  show: boolean;
  brand: Brand | null;
  loading: boolean;
  categories: Category[];
  onClose: () => void;
  onSubmit: (
    data: BrandRequest,
    file: File | null
  ) => Promise<void>;
}

const initialForm: BrandRequest = {
  brandName: '',
  brandLogoUrl: '',
  description: '',
  status: 'ACTIVE',
  categoryIds: [],
};

export function BrandModal({
  show,
  brand,
  loading,
  categories,
  onClose,
  onSubmit,
}: BrandModalProps) {
  const [form, setForm] =
    useState<BrandRequest>(initialForm);

  const [file, setFile] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState('');

  // Load existing brand data for Edit
  useEffect(() => {
    if (!show) return;

    if (brand) {
      setForm({
        brandName: brand.brandName,
        brandLogoUrl: brand.brandLogoUrl ?? '',
        description: brand.description ?? '',
        status: brand.status,
        categoryIds: [...(brand.categoryIds ?? [])],
      });

      setPreview(getLogoUrl(brand.brandLogoUrl));
    } else {
      setForm({
        ...initialForm,
        categoryIds: [],
      });

      setPreview('');
    }

    setFile(null);
  }, [brand, show]);

  // Release temporary image preview URLs
  useEffect(() => {
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (!show) return null;

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'status'
          ? (value as BrandStatus)
          : value,
    }));
  };

  // Add/remove category IDs
  const handleCategoryChange = (
    categoryId: number,
    checked: boolean
  ) => {
    setForm((prev) => {
      const currentIds = prev.categoryIds ?? [];

      return {
        ...prev,
        categoryIds: checked
          ? currentIds.includes(categoryId)
            ? currentIds
            : [...currentIds, categoryId]
          : currentIds.filter(
              (id) => id !== categoryId
            ),
      };
    });
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('Logo file must be smaller than 5MB.');
      e.target.value = '';
      return;
    }

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      alert('Only PNG, JPG or WEBP images are allowed.');
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    const brandName = form.brandName.trim();

    if (!brandName) {
      alert('Brand name is required.');
      return;
    }

    await onSubmit(
      {
        ...form,
        brandName,
        description: form.description?.trim() ?? '',
        brandLogoUrl: form.brandLogoUrl?.trim() ?? '',
        categoryIds: [...(form.categoryIds ?? [])],
      },
      file
    );
  };

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-4">

          <div className="modal-header px-4 py-3">
            <div>
              <h5 className="modal-title fw-bold mb-1">
                {brand ? 'Edit Brand' : 'Create Brand'}
              </h5>

              <small className="text-secondary">
                {brand
                  ? 'Update brand information and categories'
                  : 'Add a new brand to your store'}
              </small>
            </div>

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
              disabled={loading}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">

              {/* LOGO */}
              <div className="d-flex align-items-center gap-3 mb-4">
                <div
                  className="rounded-4 border bg-light d-flex align-items-center justify-content-center overflow-hidden"
                  style={{
                    width: 90,
                    height: 90,
                    flexShrink: 0,
                  }}
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt="Brand logo preview"
                      className="w-100 h-100 p-2"
                      style={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <i className="bi bi-image fs-2 text-secondary" />
                  )}
                </div>

                <div>
                  <label
                    htmlFor="brandLogo"
                    className="btn btn-outline-primary btn-sm"
                  >
                    <i className="bi bi-upload me-2" />
                    Upload Logo
                  </label>

                  <input
                    id="brandLogo"
                    type="file"
                    className="d-none"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleFileChange}
                    disabled={loading}
                  />

                  <div className="small text-secondary mt-2">
                    PNG, JPG or WEBP · Max 5MB
                  </div>

                  {file && (
                    <div className="small text-primary mt-1">
                      {file.name}
                    </div>
                  )}
                </div>
              </div>

              {/* BRAND NAME */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Brand Name <span className="text-danger">*</span>
                </label>

                <input
                  type="text"
                  name="brandName"
                  className="form-control"
                  placeholder="e.g. Nike"
                  value={form.brandName}
                  onChange={handleChange}
                  maxLength={100}
                  required
                  disabled={loading}
                />
              </div>

              {/* CATEGORIES */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Categories
                </label>

                {categories.length === 0 ? (
                  <div className="border rounded-3 p-3 text-secondary small">
                    No categories available.
                  </div>
                ) : (
                  <div
                    className="border rounded-3 p-3"
                    style={{
                      maxHeight: 220,
                      overflowY: 'auto',
                    }}
                  >
                    <div className="row g-2">
                      {categories.map((category) => {
                        const checked = (
                          form.categoryIds ?? []
                        ).includes(category.categoryId);

                        return (
                          <div
                            className="col-md-6"
                            key={category.categoryId}
                          >
                            <label
                              className={`d-flex align-items-center gap-2 border rounded-3 p-2 ${
                                checked
                                  ? 'border-primary bg-primary-subtle'
                                  : ''
                              }`}
                              style={{ cursor: 'pointer' }}
                            >
                              <input
                                type="checkbox"
                                className="form-check-input m-0"
                                checked={checked}
                                disabled={loading}
                                onChange={(e) =>
                                  handleCategoryChange(
                                    category.categoryId,
                                    e.target.checked
                                  )
                                }
                              />

                              <span>
                                {category.categoryName}
                              </span>
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="form-text">
                  Select one or more categories. Existing categories are checked when editing.
                </div>
              </div>

              {/* DESCRIPTION */}
              <div className="mb-3">
                <label className="form-label fw-semibold">
                  Description
                </label>

                <textarea
                  name="description"
                  className="form-control"
                  rows={4}
                  placeholder="Write something about this brand..."
                  value={form.description ?? ''}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              {/* STATUS */}
              <div>
                <label className="form-label fw-semibold">
                  Status
                </label>

                <div className="row g-2">
                  {(['ACTIVE', 'INACTIVE'] as BrandStatus[]).map(
                    (item) => (
                      <div className="col-6" key={item}>
                        <label
                          className={`border rounded-3 p-3 w-100 ${
                            form.status === item
                              ? 'border-primary bg-primary-subtle'
                              : ''
                          }`}
                          style={{ cursor: 'pointer' }}
                        >
                          <input
                            type="radio"
                            name="status"
                            value={item}
                            checked={form.status === item}
                            onChange={handleChange}
                            disabled={loading}
                            className="form-check-input me-2"
                          />

                          <span className="fw-semibold">
                            {item === 'ACTIVE' ? 'Active' : 'Inactive'}
                          </span>
                        </label>
                      </div>
                    )
                  )}
                </div>
              </div>

            </div>

            <div className="modal-footer px-4">
              <button
                type="button"
                className="btn btn-light"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="btn btn-primary px-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span
                      className="spinner-border spinner-border-sm me-2"
                      role="status"
                      aria-hidden="true"
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2" />
                    {brand ? 'Save Changes' : 'Create Brand'}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

