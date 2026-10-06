
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

// =====================================================
// BACKEND URL
// =====================================================

const API_BASE_URL =
  'http://localhost:8080';

// =====================================================
// LOGO URL HELPER
// =====================================================

const getLogoUrl = (
  logoUrl?: string | null
): string => {

  if (!logoUrl) {
    return '';
  }

  // Already full URL
  if (
    logoUrl.startsWith('http://') ||
    logoUrl.startsWith('https://')
  ) {
    return logoUrl;
  }

  return `${API_BASE_URL}${
    logoUrl.startsWith('/')
      ? ''
      : '/'
  }${logoUrl}`;
};

// =====================================================
// PROPS
// =====================================================

interface BrandModalProps {
  show: boolean;
  brand: Brand | null;
  loading: boolean;

  onClose: () => void;

  onSubmit: (
    data: BrandRequest,
    file: File | null
  ) => Promise<void>;
}

// =====================================================
// INITIAL FORM
// =====================================================

const initialForm: BrandRequest = {
  brandName: '',
  brandLogoUrl: '',
  description: '',
  status: 'ACTIVE',
};

// =====================================================
// MODAL
// =====================================================

export function BrandModal({
  show,
  brand,
  loading,
  onClose,
  onSubmit,
}: BrandModalProps) {

  const [form, setForm] =
    useState<BrandRequest>(
      initialForm
    );

  const [file, setFile] =
    useState<File | null>(null);

  const [preview, setPreview] =
    useState('');

  // =====================================================
  // LOAD BRAND DATA
  // =====================================================

  useEffect(() => {

    if (brand) {

      setForm({
        brandName:
          brand.brandName,

        brandLogoUrl:
          brand.brandLogoUrl ?? '',

        description:
          brand.description ?? '',

        status:
          brand.status,
      });

      setPreview(
        getLogoUrl(
          brand.brandLogoUrl
        )
      );

    } else {

      setForm({
        ...initialForm,
      });

      setPreview('');
    }

    setFile(null);

  }, [brand, show]);

  // =====================================================
  // HIDE MODAL
  // =====================================================

  if (!show) {
    return null;
  }

  // =====================================================
  // INPUT CHANGE
  // =====================================================

  const handleChange = (
    e: ChangeEvent<
      HTMLInputElement |
      HTMLTextAreaElement |
      HTMLSelectElement
    >
  ) => {

    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // FILE CHANGE
  // =====================================================

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>
  ) => {

    const selectedFile =
      e.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    // ---------------------------------------------------
    // MAX FILE SIZE: 5MB
    // ---------------------------------------------------

    const maxSize =
      5 * 1024 * 1024;

    if (
      selectedFile.size >
      maxSize
    ) {

      alert(
        'Logo file must be smaller than 5MB.'
      );

      e.target.value = '';

      return;
    }

    // ---------------------------------------------------
    // ALLOWED TYPES
    // ---------------------------------------------------

    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
    ];

    if (
      !allowedTypes.includes(
        selectedFile.type
      )
    ) {

      alert(
        'Only PNG, JPG or WEBP images are allowed.'
      );

      e.target.value = '';

      return;
    }

    // ---------------------------------------------------
    // SET FILE
    // ---------------------------------------------------

    setFile(
      selectedFile
    );

    // ---------------------------------------------------
    // LOCAL PREVIEW
    // ---------------------------------------------------

    const imageUrl =
      URL.createObjectURL(
        selectedFile
      );

    setPreview(imageUrl);
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit = async (
    e: FormEvent<HTMLFormElement>
  ) => {

    e.preventDefault();

    // ---------------------------------------------------
    // BRAND NAME VALIDATION
    // ---------------------------------------------------

    if (
      !form.brandName.trim()
    ) {

      alert(
        'Brand name is required.'
      );

      return;
    }

    // ---------------------------------------------------
    // SUBMIT TO PARENT
    // ---------------------------------------------------

    await onSubmit(
      {
        ...form,

        brandName:
          form.brandName.trim(),

        description:
          form.description?.trim() ||
          '',

        brandLogoUrl:
          form.brandLogoUrl?.trim() ||
          '',
      },

      file
    );
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      role="dialog"
      style={{
        backgroundColor:
          'rgba(15, 23, 42, 0.55)',
      }}
    >

      <div className="modal-dialog modal-dialog-centered modal-lg">

        <div className="modal-content border-0 shadow-lg rounded-4">

          {/* =================================================
              HEADER
          ================================================= */}

          <div className="modal-header px-4 py-3">

            <div>

              <h5 className="modal-title fw-bold mb-1">

                {brand
                  ? 'Edit Brand'
                  : 'Create Brand'}

              </h5>

              <small className="text-secondary">

                {brand
                  ? 'Update brand information'
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

          {/* =================================================
              FORM
          ================================================= */}

          <form
            onSubmit={
              handleSubmit
            }
          >

            {/* =================================================
                BODY
            ================================================= */}

            <div className="modal-body p-4">

              {/* =================================================
                  LOGO
              ================================================= */}

              <div className="d-flex align-items-center gap-3 mb-4">

                {/* PREVIEW */}

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
                      alt="Brand logo"
                      className="w-100 h-100 p-2"
                      style={{
                        objectFit:
                          'contain',
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display =
                          'none';
                      }}
                    />

                  ) : (

                    <i className="bi bi-image fs-2 text-secondary" />

                  )}

                </div>

                {/* UPLOAD */}

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
                    onChange={
                      handleFileChange
                    }
                  />

                  <div className="small text-secondary mt-2">

                    PNG, JPG or WEBP · Max 5MB

                  </div>

                  {file && (

                    <div className="small text-primary mt-1">

                      <i className="bi bi-paperclip me-1" />

                      {file.name}

                    </div>

                  )}

                </div>

              </div>

              {/* =================================================
                  BRAND NAME
              ================================================= */}

              <div className="mb-3">

                <label className="form-label fw-semibold">

                  Brand Name

                  <span className="text-danger ms-1">
                    *
                  </span>

                </label>

                <input
                  type="text"
                  name="brandName"
                  className="form-control"
                  placeholder="e.g. Nike"
                  value={
                    form.brandName
                  }
                  onChange={
                    handleChange
                  }
                  maxLength={100}
                  required
                />

                <div className="form-text">

                  Maximum 100 characters.

                </div>

              </div>

              {/* =================================================
                  DESCRIPTION
              ================================================= */}

              <div className="mb-3">

                <label className="form-label fw-semibold">

                  Description

                </label>

                <textarea
                  name="description"
                  className="form-control"
                  rows={4}
                  placeholder="Write something about this brand..."
                  value={
                    form.description ?? ''
                  }
                  onChange={
                    handleChange
                  }
                />

              </div>

              {/* =================================================
                  STATUS
              ================================================= */}

              <div>

                <label className="form-label fw-semibold">

                  Status

                </label>

                <div className="row g-2">

                  {(
                    [
                      'ACTIVE',
                      'INACTIVE',
                    ] as BrandStatus[]
                  ).map((item) => (

                    <div
                      className="col-6"
                      key={item}
                    >

                      <label
                        className={`border rounded-3 p-3 w-100 ${
                          form.status === item
                            ? 'border-primary bg-primary-subtle'
                            : ''
                        }`}
                        style={{
                          cursor:
                            'pointer',
                        }}
                      >

                        <input
                          type="radio"
                          name="status"
                          value={item}
                          checked={
                            form.status ===
                            item
                          }
                          onChange={
                            handleChange
                          }
                          className="form-check-input me-2"
                        />

                        <span className="fw-semibold">

                          {item ===
                          'ACTIVE'
                            ? 'Active'
                            : 'Inactive'}

                        </span>

                      </label>

                    </div>

                  ))}

                </div>

              </div>

            </div>

            {/* =================================================
                FOOTER
            ================================================= */}

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

                    {brand
                      ? 'Save Changes'
                      : 'Create Brand'}
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

