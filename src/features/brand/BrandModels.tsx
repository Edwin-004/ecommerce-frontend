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
import { FiImage, FiUpload, FiCheck } from 'react-icons/fi';

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

  const [errorMessage, setErrorMessage] = useState('');

  // Load existing brand data for Edit
  useEffect(() => {
    if (!show) return;

    setErrorMessage('');

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
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement
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
      setErrorMessage('Logo file must be smaller than 5MB.');
      e.target.value = '';
      return;
    }

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setErrorMessage('Only PNG, JPG or WEBP images are allowed.');
      e.target.value = '';
      return;
    }

    setErrorMessage('');
    setFile(selectedFile);
  };

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setErrorMessage('');

    const brandName = form.brandName.trim();

    if (!brandName) {
      setErrorMessage('Brand name is required.');
      return;
    }

    try {
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
    } catch (error: any) {
     
      const rawMsg =
        error?.response?.data?.message ||
        error?.message ||
        '';

    
      if (
        rawMsg.toLowerCase().includes('already exists') ||
        rawMsg.toLowerCase().includes('duplicate')
      ) {
        setErrorMessage(
          'This brand name already exists. Please choose a different brand name and try again.'
        );
      } else {
        setErrorMessage(
          rawMsg || 'An unexpected error occurred. Please try again.'
        );
      }
    }
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

              {errorMessage && (
                <div
                  className="alert alert-danger mb-4 py-2 px-3 rounded-3"
                  role="alert"
                >
                  <div className="d-flex align-items-start gap-2">
                    <span style={{ fontSize: '16px', lineHeight: '1.2' }}>⚠️</span>
                    <div className="small" style={{ wordBreak: 'break-word', lineHeight: '1.4' }}>
                      {errorMessage}
                    </div>
                  </div>
                </div>
              )}

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
                    <FiImage size={32} className="text-secondary" />
                  )}
                </div>

                <div>
                  <label
                    htmlFor="brandLogo"
                    className="btn btn-outline-primary btn-sm"
                  >
                    <FiUpload size={14} className="me-2" />
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
                              className="d-flex align-items-center gap-2 border rounded-3 p-2"
                              style={{
                                cursor: loading ? 'not-allowed' : 'pointer',
                                borderColor: checked ? '#0d6efd' : '#dee2e6',
                                backgroundColor: checked ? '#cfe2ff' : '#ffffff',
                                transition: 'background-color 0.15s ease, border-color 0.15s ease',
                                minHeight: 48,
                                userSelect: 'none',
                                opacity: loading ? 0.7 : 1,
                              }}
                            >
                              {/* Hidden Native Checkbox */}
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={loading}
                                onChange={(e) => {
                                  handleCategoryChange(
                                    category.categoryId,
                                    e.currentTarget.checked
                                  );
                                }}
                                style={{
                                  position: 'absolute',
                                  width: 1,
                                  height: 1,
                                  opacity: 0,
                                  pointerEvents: 'none',
                                }}
                              />

                              {/* Custom Checkbox UI */}
                              <span
                                aria-hidden="true"
                                style={{
                                  width: 20,
                                  height: 20,
                                  minWidth: 20,
                                  borderRadius: 5,
                                  border: checked
                                    ? '2px solid #0d6efd'
                                    : '1.5px solid #cbd5e1',
                                  backgroundColor: checked
                                    ? '#0d6efd'
                                    : '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                {checked && (
                                  <FiCheck
                                    size={14}
                                    color="#ffffff"
                                    strokeWidth={3}
                                  />
                                )}
                              </span>

                              <span
                                style={{
                                  fontSize: 15,
                                  color: '#212529',
                                  fontWeight: checked ? 500 : 400,
                                }}
                              >
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
                    <FiCheck size={16} className="me-2" />
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