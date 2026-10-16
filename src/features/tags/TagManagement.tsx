import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";

import { tagApi } from "./tagApi";

import type {
  TagRequestDto,
  TagResponseDto,
} from "../../types/tag";
import {
  FiTag,
  FiPlus,
  FiCheck,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

import "./TagManagement.css";

const PAGE_SIZE = 10;

function getErrorMessage(error: unknown): string {
  if (isAxiosError<{ message?: string; error?: string }>(error)) {
    return (
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Request failed."
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

function formatDate(date?: string | null) {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TagManagement() {
  const [tags, setTags] = useState<TagResponseDto[]>([]);
  const [tagName, setTagName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Modal Open/Close State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search input
  const [search, setSearch] = useState("");

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  /**
   * Debounce search input.
   */
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);

    return () => {
      window.clearTimeout(timer);
    };
  }, [search]);

  /**
   * Reset pagination when search keyword changes.
   */
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  /**
   * Load tags from backend.
   */
  const loadTags = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await tagApi.getAllTags(
        page,
        PAGE_SIZE,
        "tagName,asc",
        debouncedSearch
      );

      setTags(result.content);
      setTotalPages(result.totalPages);
      setTotalElements(result.totalElements);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  /**
   * Load whenever page or search changes.
   */
  useEffect(() => {
    void loadTags();
  }, [loadTags]);

  const resetForm = () => {
    setTagName("");
    setEditingId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setError("");
    setIsModalOpen(true);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("create") === "true") {
      openCreateModal();
    }
  }, []);

  const handleEdit = (tag: TagResponseDto) => {
    setEditingId(tag.tagId);
    setTagName(tag.tagName);
    setError("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    resetForm();
    setError("");
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    const trimmedName = tagName.trim();

    if (!trimmedName) {
      setError("Tag name is required.");
      return;
    }

    if (trimmedName.length > 100) {
      setError("Tag name must not exceed 100 characters.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const request: TagRequestDto = {
      tagName: trimmedName,
    };

    try {
      if (editingId !== null) {
        await tagApi.updateTag(editingId, request);
        setSuccess("Tag updated successfully.");
      } else {
        await tagApi.createTag(request);
        setSuccess("Tag created successfully.");
      }

      closeModal();
      await loadTags();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tag: TagResponseDto) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${tag.tagName}"?`
    );

    if (!confirmed) return;

    setDeletingId(tag.tagId);
    setError("");
    setSuccess("");

    try {
      await tagApi.deleteTag(tag.tagId);

      setSuccess("Tag deleted successfully.");

      if (tags.length === 1 && page > 0) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await loadTags();
      }

      if (editingId === tag.tagId) {
        closeModal();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="tag-page">
      {/* 1. Header (Catalogue Eyebrow + Title + Subtitle + Add Tag Button) */}
      <div className="tag-page-header">
        <div className="tag-header-left">
          <div className="tag-eyebrow">
            CATALOGUE
          </div>

          <h1>
            <FiTag style={{ marginRight: 8, verticalAlign: 'middle' }} /> Tag Management
          </h1>

          <p>
            Create and manage product tags across your inventory.
          </p>
        </div>

        <button
          type="button"
          className="tag-btn-add-primary"
          onClick={openCreateModal}
        >
          <FiPlus size={16} /> Add Tag
        </button>
      </div>

      {/* 2. 3 Metric Summary Cards (like Product Management) */}
      <div className="tag-metrics-grid">
        <div className="tag-metric-card">
          <div className="tag-metric-label">Total in Catalogue</div>
          <div className="tag-metric-value">{totalElements}</div>
        </div>

        <div className="tag-metric-card">
          <div className="tag-metric-label">Matching Filters</div>
          <div className="tag-metric-value">
            {debouncedSearch ? tags.length : totalElements}
          </div>
        </div>

        <div className="tag-metric-card">
          <div className="tag-metric-label">Current Page</div>
          <div className="tag-metric-value">
            {totalPages === 0 ? "0 / 0" : `${page + 1} / ${totalPages}`}
          </div>
        </div>
      </div>

      {/* 3. Global Notifications */}
      {error && !isModalOpen && (
        <div className="alert alert-error">
          <span className="alert-icon">
            <FiAlertCircle size={16} />
          </span>

          <div>
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
            aria-label="Close error"
          >
            <FiX size={15} />
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">
            <FiCheckCircle size={16} />
          </span>

          <div>
            <strong>Success</strong>
            <p>{success}</p>
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
            aria-label="Close success"
          >
            <FiX size={15} />
          </button>
        </div>
      )}

      {/* 4. Single Unified Tag Table Card */}
      <section className="tag-table-card">
        <div className="table-toolbar">
          <div>
            <h2>All Tags</h2>

            <p>
              {totalElements}{" "}
              {totalElements === 1 ? "tag" : "tags"} in your inventory
            </p>
          </div>

          <div className="table-toolbar-right">
            <div className="search-wrapper">
              <FiSearch className="search-icon" size={15} />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search tags..."
                aria-label="Search tags"
              />

              {search && (
                <button
                  type="button"
                  className="clear-search"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            <button
              type="button"
              className="refresh-button"
              onClick={() => void loadTags()}
              disabled={loading}
              title="Refresh"
            >
              <FiRefreshCw size={14} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>

        <div className="table-container">
          <table className="tag-table">
            <thead>
              <tr>
                <th className="id-column">ID</th>
                <th>TAG</th>
                <th>CREATED</th>
                <th>LAST MODIFIED</th>
                <th className="actions-column">ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="loading-state">
                      <span className="large-spinner" />
                      <span>Loading tags...</span>
                    </div>
                  </td>
                </tr>
              ) : tags.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">
                      <div className="empty-icon">#</div>

                      <h3>
                        {debouncedSearch
                          ? "No matching tags"
                          : "No tags yet"}
                      </h3>

                      <p>
                        {debouncedSearch
                          ? "Try a different search keyword."
                          : "Create your first tag to get started."}
                      </p>

                      {debouncedSearch ? (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                        >
                          Clear Search
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="primary-button"
                          style={{ marginTop: 12 }}
                          onClick={openCreateModal}
                        >
                          <FiPlus size={14} /> Add First Tag
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                tags.map((tag) => (
                  <tr key={tag.tagId}>
                    <td className="id-cell">
                      #{tag.tagId}
                    </td>

                    <td>
                      <div className="tag-name-cell">
                        <div className="tag-avatar">
                          #
                        </div>

                        <div>
                          <strong>{tag.tagName}</strong>

                          <span>
                            Product tag
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="date-cell">
                        <strong>
                          {formatDate(tag.createdAt)}
                        </strong>

                        {tag.createdByName && (
                          <span>
                            by {tag.createdByName}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div className="date-cell">
                        <strong>
                          {formatDate(tag.modifiedAt)}
                        </strong>

                        {tag.modifiedByName && (
                          <span>
                            by {tag.modifiedByName}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                        <button
                          type="button"
                          className="table-btn-edit"
                          onClick={() => handleEdit(tag)}
                          title="Edit tag"
                        >
                          <FiEdit2 size={12} /> Edit
                        </button>

                        <button
                          type="button"
                          className="table-btn-delete"
                          onClick={() =>
                            void handleDelete(tag)
                          }
                          disabled={
                            deletingId === tag.tagId
                          }
                          title="Delete tag"
                        >
                          {deletingId === tag.tagId ? (
                            <span className="spinner" style={{ width: 12, height: 12 }} />
                          ) : (
                            <>
                              <FiTrash2 size={12} /> Delete
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          <div className="pagination-info">
            Showing{" "}
            <strong>
              {tags.length}
            </strong>{" "}
            of{" "}
            <strong>{totalElements}</strong> tags
          </div>

          <div className="pagination-controls">
            <button
              type="button"
              onClick={() =>
                setPage((current) => current - 1)
              }
              disabled={page === 0 || loading}
              aria-label="Previous page"
            >
              <FiChevronLeft size={16} />
            </button>

            <div className="page-number">
              {totalPages === 0 ? 0 : page + 1}
              <span>/</span>
              {totalPages}
            </div>

            <button
              type="button"
              onClick={() =>
                setPage((current) => current + 1)
              }
              disabled={
                loading ||
                totalPages === 0 ||
                page >= totalPages - 1
              }
              aria-label="Next page"
            >
              <FiChevronRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* 5. Create / Edit Tag Modal Dialog */}
      {isModalOpen && (
        <div
          className="tag-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="tag-modal-card">
            <div className="tag-modal-header">
              <div>
                <h3>
                  {editingId !== null ? <FiEdit2 size={16} /> : <FiPlus size={16} />}
                  {editingId !== null ? "Edit Tag" : "Create New Tag"}
                </h3>
                <p>
                  {editingId !== null
                    ? "Update the selected product tag."
                    : "Add a new tag to organize your products."}
                </p>
              </div>

              <button
                type="button"
                className="tag-modal-close"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="alert alert-error" style={{ marginBottom: 16 }}>
                  <span className="alert-icon">
                    <FiAlertCircle size={15} />
                  </span>
                  <p style={{ margin: 0, fontSize: 13 }}>{error}</p>
                </div>
              )}

              <div className="form-field" style={{ marginBottom: 18 }}>
                <label htmlFor="modalTagName">
                  Tag Name <span>*</span>
                </label>

                <div className={`tag-input-wrapper ${editingId !== null ? "is-editing" : ""}`}>
                  <span className="input-prefix">#</span>
                  <input
                    id="modalTagName"
                    name="tagName"
                    type="text"
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    placeholder="e.g. New Arrival"
                    maxLength={100}
                    required
                    autoFocus
                  />
                  <span className="character-count">
                    {tagName.length}/100
                  </span>
                </div>

                <p className="field-help">
                  Use a short and descriptive name for your tag.
                </p>
              </div>

              <div className="tag-modal-footer">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="primary-button"
                >
                  {saving ? (
                    <>
                      <span className="spinner" /> Saving...
                    </>
                  ) : editingId !== null ? (
                    <>
                      <FiCheck size={15} /> Update Tag
                    </>
                  ) : (
                    <>
                      <FiPlus size={15} /> Create Tag
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}