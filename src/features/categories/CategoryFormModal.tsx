import React, { useState, useRef, useEffect } from "react";
import { FiSave, FiPlus, FiAlertCircle, FiChevronDown, FiFolder, FiGitBranch } from "react-icons/fi";
import {
  type CategoryRequestDto,
  type CategoryResponseDto,
} from "../../types/category";
import styles from "./CategoryFormModal.module.css";

interface CategoryFormModalProps {
  isOpen: boolean;
  formData: CategoryRequestDto;
  editingId: number | null;
  saving: boolean;
  errorMessage: string | null;
  availableParents: CategoryResponseDto[];
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onClose: () => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  formData,
  editingId,
  saving,
  errorMessage,
  availableParents,
  onInputChange,
  onSubmit,
  onClose,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Outside Click ပိတ်ရန်
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Selected Category
  const selectedParent = availableParents.find(
    (c) => c.categoryId === formData.parentId
  );

  // Category အဆင့် (Depth) စစ်ဆေးပေးသည့် Helper
  const getCategoryLevel = (cat: CategoryResponseDto): number => {
    let level = 1;
    let currentParentName = cat.parentName;
    while (currentParentName) {
      level++;
      const parentCat = availableParents.find((p) => p.categoryName === currentParentName);
      currentParentName = parentCat?.parentName;
    }
    return level;
  };

  const handleSelectParent = (id: number | null) => {
    const syntheticEvent = {
      target: {
        name: "parentId",
        value: id ? id.toString() : "",
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    onInputChange(syntheticEvent);
    setDropdownOpen(false);
  };

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      style={{ backgroundColor: "rgba(15, 23, 42, 0.55)" }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-4">
          <div className="modal-header px-4 py-3">
            <div>
              <h5 className="modal-title fw-bold mb-1">
                {editingId !== null ? "Edit Category" : "Create Category"}
              </h5>
              <small className="text-secondary">
                {editingId !== null
                  ? "Update category information"
                  : "Add a new category to your store"}
              </small>
            </div>

            <button
              type="button"
              className="btn-close"
              aria-label="Close"
              onClick={onClose}
              disabled={saving}
            />
          </div>

          <form onSubmit={onSubmit}>
            <div className="modal-body p-4">
              {/* Error Alert */}
              {errorMessage && (
                <div className="alert alert-danger d-flex align-items-center gap-2 mb-3 rounded-3" role="alert">
                  <FiAlertCircle className="flex-shrink-0 fs-5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* Category Name */}
              <div className="mb-3">
                <label htmlFor="categoryName" className="form-label fw-semibold">
                  Category Name <span className="text-danger">*</span>
                </label>
                <input
                  id="categoryName"
                  name="categoryName"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Electronics"
                  value={formData.categoryName}
                  onChange={onInputChange}
                  maxLength={120}
                  required
                  disabled={saving}
                />
              </div>

              {/* Custom Clean Parent Category Select */}
              <div className="mb-3 position-relative" ref={dropdownRef}>
                <label className="form-label fw-semibold">Parent Category</label>
                
                <button
                  type="button"
                  className={styles.customSelectBtn}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  disabled={saving}
                >
                  {selectedParent ? (
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-medium text-dark">{selectedParent.categoryName}</span>
                      {selectedParent.parentId ? (
                        <span className={styles.badgeSub}>Subcategory</span>
                      ) : (
                        <span className={styles.badgeMain}>Main Category</span>
                      )}
                    </div>
                  ) : (
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-secondary">None (Create as Main Category)</span>
                      <span className={styles.badgeMain}>Main</span>
                    </div>
                  )}
                  <FiChevronDown className="text-secondary fs-5" />
                </button>

                {/* Custom Menu */}
                {dropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {/* Option: None */}
                    <button
                      type="button"
                      className={`${styles.dropdownOption} ${
                        formData.parentId === null ? styles.active : ""
                      }`}
                      onClick={() => handleSelectParent(null)}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <FiFolder className="text-primary" />
                        <span>None (Create as Main Category)</span>
                      </div>
                      <span className={styles.badgeMain}>Main</span>
                    </button>

                    <div className="dropdown-divider my-1"></div>

                    {/* Options List */}
                    {availableParents.map((cat) => {
                      const level = getCategoryLevel(cat);
                      const isMaxDepth = level >= 3; // MAX_DEPTH = 3 စစ်ပေးခြင်း
                      const isSub = !!cat.parentId;

                      return (
                        <button
                          key={cat.categoryId}
                          type="button"
                          className={`${styles.dropdownOption} ${
                            formData.parentId === cat.categoryId ? styles.active : ""
                          }`}
                          onClick={() => !isMaxDepth && handleSelectParent(cat.categoryId)}
                          disabled={isMaxDepth}
                        >
                          <div className="d-flex align-items-center gap-2" style={{ paddingLeft: `${(level - 1) * 12}px` }}>
                            {isSub ? (
                              <FiGitBranch style={{ color: "#8b5cf6" }} />
                            ) : (
                              <FiFolder className="text-primary" />
                            )}
                            <span>{cat.categoryName}</span>
                          </div>

                          {isMaxDepth ? (
                            <span className={styles.badgeDisabled}>Max Level (3)</span>
                          ) : isSub ? (
                            <span className={styles.badgeSub}>Subcategory</span>
                          ) : (
                            <span className={styles.badgeMain}>Main Category</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="form-text">
                  Leave empty to create a Main Category. Max depth allowed is 3 levels.
                </div>
              </div>

              {/* Description */}
              <div className="mb-3">
                <label htmlFor="description" className="form-label fw-semibold">
                  Description <span className="text-muted">(Optional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  className="form-control"
                  placeholder="Enter category description..."
                  rows={4}
                  value={formData.description}
                  onChange={onInputChange}
                  disabled={saving}
                />
              </div>
            </div>

            <div className="modal-footer px-4 py-3 bg-light rounded-bottom-4">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary d-flex align-items-center gap-2"
                disabled={saving}
              >
                {editingId !== null ? <FiSave /> : <FiPlus />}
                {saving
                  ? "Saving..."
                  : editingId !== null
                  ? "Update Category"
                  : "Create Category"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CategoryFormModal;