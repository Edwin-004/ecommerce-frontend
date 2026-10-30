
import React, { useState, useRef, useEffect } from "react";
import {
  FiSave,
  FiPlus,
  FiAlertCircle,
  FiChevronDown,
  FiFolder,
  FiGitBranch,
  FiTrash2,
} from "react-icons/fi";

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

  onSubmit: (
    e: React.FormEvent,
    subcategories?: string[]
  ) => Promise<void>;

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
  const [subcategories, setSubcategories] = useState<string[]>([""]);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset subcategories when opening a new category form
  useEffect(() => {
    if (isOpen) {
      setSubcategories(editingId === null ? [""] : []);
      setDropdownOpen(false);
    }
  }, [isOpen, editingId]);

  // Close parent dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!isOpen) return null;

  const selectedParent = availableParents.find(
    (category) => category.categoryId === formData.parentId
  );

  // Get category depth
  const getCategoryLevel = (category: CategoryResponseDto): number => {
    let level = 1;
    let currentParentName = category.parentName;
    const visited = new Set<number>([category.categoryId]);

    while (currentParentName) {
      const parentCategory = availableParents.find(
        (parent) => parent.categoryName === currentParentName
      );

      if (!parentCategory || visited.has(parentCategory.categoryId)) {
        break;
      }

      visited.add(parentCategory.categoryId);
      level++;
      currentParentName = parentCategory.parentName;
    }

    return level;
  };

  const handleSelectParent = (id: number | null) => {
    const syntheticEvent = {
      target: {
        name: "parentId",
        value: id === null ? "" : String(id),
      },
    } as React.ChangeEvent<HTMLSelectElement>;

    onInputChange(syntheticEvent);
    setDropdownOpen(false);
  };

  const addSubcategory = () => {
    setSubcategories((previous) => [...previous, ""]);
  };

  const updateSubcategory = (index: number, value: string) => {
    setSubcategories((previous) =>
      previous.map((name, i) => (i === index ? value : name))
    );
  };

  const removeSubcategory = (index: number) => {
    setSubcategories((previous) =>
      previous.filter((_, i) => i !== index)
    );
  };

  const handleFormSubmit = (event: React.FormEvent) => {
    const names =
      editingId === null && formData.parentId == null
        ? subcategories
            .map((name) => name.trim())
            .filter((name) => name.length > 0)
        : [];

    void onSubmit(event, names);
  };

  // Only root categories can have subcategories added in this form.
  const canAddSubcategories =
    editingId === null && formData.parentId == null;

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="categoryModalTitle"
      style={{ backgroundColor: "rgba(15, 23, 42, 0.55)" }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg rounded-4">
          {/* Header */}
          <div className="modal-header px-4 py-3">
            <div>
              <h5
                id="categoryModalTitle"
                className="modal-title fw-bold mb-1"
              >
                {editingId !== null
                  ? "Edit Category"
                  : "Create Category"}
              </h5>

              <small className="text-secondary">
                {editingId !== null
                  ? "Update category information"
                  : "Create a category and optionally add subcategories"}
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

          {/* Form */}
          <form onSubmit={handleFormSubmit}>
            <div className="modal-body p-4">
              {/* Error */}
              {errorMessage && (
                <div
                  className="alert alert-danger d-flex align-items-center gap-2 mb-3 rounded-3"
                  role="alert"
                >
                  <FiAlertCircle className="flex-shrink-0 fs-5" />
                  <div>{errorMessage}</div>
                </div>
              )}

              {/* Category Name */}
              <div className="mb-3">
                <label
                  htmlFor="categoryName"
                  className="form-label fw-semibold"
                >
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

              {/* Add Subcategories */}
              {canAddSubcategories && (
                <div className="mb-4 p-3 border rounded-3">
                  <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                    <div>
                      <label className="form-label fw-semibold mb-1">
                        Subcategories
                      </label>

                      <div className="small text-secondary">
                        Optional — add them under this main category.
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm d-flex align-items-center gap-1 flex-shrink-0"
                      onClick={addSubcategory}
                      disabled={saving}
                    >
                      <FiPlus />
                      Add
                    </button>
                  </div>

                  {subcategories.map((name, index) => (
                    <div
                      key={index}
                      className="d-flex align-items-center gap-2 mb-2"
                    >
                      <FiGitBranch
                        className="flex-shrink-0"
                        style={{ color: "#8b5cf6" }}
                      />

                      <input
                        type="text"
                        className="form-control"
                        placeholder={`Subcategory ${index + 1}`}
                        aria-label={`Subcategory ${index + 1}`}
                        value={name}
                        onChange={(event) =>
                          updateSubcategory(index, event.target.value)
                        }
                        maxLength={120}
                        disabled={saving}
                      />

                      <button
                        type="button"
                        className="btn btn-outline-danger d-flex align-items-center justify-content-center"
                        onClick={() => removeSubcategory(index)}
                        disabled={saving}
                        aria-label={`Remove subcategory ${index + 1}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  ))}

                  {subcategories.length === 0 && (
                    <div className="text-secondary small">
                      No subcategories added. Click Add to add one.
                    </div>
                  )}
                </div>
              )}

              {/* Parent Category */}
              <div
                className="mb-3 position-relative"
                ref={dropdownRef}
              >
                <label className="form-label fw-semibold">
                  Parent Category
                </label>

                <button
                  type="button"
                  className={styles.customSelectBtn}
                  onClick={() => setDropdownOpen((previous) => !previous)}
                  disabled={saving}
                  aria-expanded={dropdownOpen}
                >
                  {selectedParent ? (
                    <div className="d-flex align-items-center gap-2">
                      <span className="fw-medium text-dark">
                        {selectedParent.categoryName}
                      </span>

                      {selectedParent.parentId != null ? (
                        <span className={styles.badgeSub}>
                          Subcategory
                        </span>
                      ) : (
                        <span className={styles.badgeMain}>
                          Main Category
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-secondary">
                        None (Create as Main Category)
                      </span>

                      <span className={styles.badgeMain}>Main</span>
                    </div>
                  )}

                  <FiChevronDown className="text-secondary fs-5" />
                </button>

                {dropdownOpen && (
                  <div className={styles.dropdownMenu}>
                    {/* Main Category option */}
                    <button
                      type="button"
                      className={`${styles.dropdownOption} ${
                        formData.parentId == null ? styles.active : ""
                      }`}
                      onClick={() => handleSelectParent(null)}
                      disabled={saving}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <FiFolder className="text-primary" />
                        <span>
                          None (Create as Main Category)
                        </span>
                      </div>

                      <span className={styles.badgeMain}>Main</span>
                    </button>

                    <div className="dropdown-divider my-1" />

                    {/* Existing categories */}
                    {availableParents.map((category) => {
                      const level = getCategoryLevel(category);
                      const isMaxDepth = level >= 3;
                      const isSub = category.parentId != null;

                      return (
                        <button
                          key={category.categoryId}
                          type="button"
                          className={`${styles.dropdownOption} ${
                            formData.parentId === category.categoryId
                              ? styles.active
                              : ""
                          }`}
                          onClick={() =>
                            !isMaxDepth &&
                            handleSelectParent(category.categoryId)
                          }
                          disabled={saving || isMaxDepth}
                        >
                          <div
                            className="d-flex align-items-center gap-2"
                            style={{
                              paddingLeft: `${(level - 1) * 12}px`,
                            }}
                          >
                            {isSub ? (
                              <FiGitBranch
                                style={{ color: "#8b5cf6" }}
                              />
                            ) : (
                              <FiFolder className="text-primary" />
                            )}

                            <span>{category.categoryName}</span>
                          </div>

                          {isMaxDepth ? (
                            <span className={styles.badgeDisabled}>
                              Max Level (3)
                            </span>
                          ) : isSub ? (
                            <span className={styles.badgeSub}>
                              Subcategory
                            </span>
                          ) : (
                            <span className={styles.badgeMain}>
                              Main Category
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="form-text">
                  Leave empty to create a Main Category. Maximum depth
                  allowed is 3 levels.
                </div>
              </div>

              {/* Description */}
              <div className="mb-3">
                <label
                  htmlFor="description"
                  className="form-label fw-semibold"
                >
                  Description{" "}
                  <span className="text-muted">(Optional)</span>
                </label>

                <textarea
                  id="description"
                  name="description"
                  className="form-control"
                  placeholder="Enter category description..."
                  rows={4}
                  value={formData.description ?? ""}
                  onChange={onInputChange}
                  disabled={saving}
                />
              </div>
            </div>

            {/* Footer */}
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
