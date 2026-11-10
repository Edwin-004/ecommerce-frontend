import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";

import { tagApi } from "./tagApi";
import { ConfirmModal } from "../../components/common/ConfirmModal";
import { toast } from "react-toastify";

import type {
  TagRequestDto,
  TagResponseDto,
} from "../../types/tag";
import {
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

export default function TagManagement() {
  const [tags, setTags] = useState<TagResponseDto[]>([]);
  const [tagName, setTagName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  // Modal Open/Close State
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Search input
  const [searchParams, setSearchParams] = useSearchParams();

  const paramPage = Number(searchParams.get("page")) || 0;
  const paramSearch = searchParams.get("search") || "";

  const [search, setSearchState] = useState(paramSearch);
  const [page, setPageState] = useState(paramPage);

  const updateTagParams = (updates: { page?: number; search?: string }) => {
    const next = new URLSearchParams(searchParams);
    const nextSearch = updates.search !== undefined ? updates.search : search;
    const nextPage = updates.page !== undefined ? updates.page : 0;

    if (nextSearch && nextSearch.trim()) next.set("search", nextSearch.trim()); else next.delete("search");
    if (nextPage > 0) next.set("page", String(nextPage)); else next.delete("page");

    setSearchParams(next, { replace: true });
  };

  const setSearch = (s: string) => {
    setSearchState(s);
    updateTagParams({ search: s, page: 0 });
  };

  const setPage = (p: number) => {
    setPageState(p);
    updateTagParams({ page: p });
  };

  useEffect(() => {
    setSearchState(searchParams.get("search") || "");
    setPageState(Number(searchParams.get("page")) || 0);
  }, [searchParams]);

  // Debounced search value
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<string>("tagId,desc");


  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteConfirmConfig, setDeleteConfirmConfig] = useState<{
    isOpen: boolean;
    tag: TagResponseDto | null;
    loading: boolean;
  }>({
    isOpen: false,
    tag: null,
    loading: false,
  });

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
  }, [debouncedSearch, sortBy]);

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
        sortBy,
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
  }, [page, debouncedSearch, sortBy]);

  const handleSortToggle = (field: string) => {
    const [currentField, currentDir] = sortBy.split(',');
    if (currentField === field) {
      setSortBy(`${field},${currentDir === 'asc' ? 'desc' : 'asc'}`);
    } else {
      setSortBy(`${field},${field === 'tagName' ? 'asc' : 'desc'}`);
    }
  };

  const renderSortIndicator = (field: string) => {
    const [currentField, currentDir] = sortBy.split(',');
    if (currentField !== field) {
      return <span style={{ opacity: 0.35, marginLeft: '4px', fontSize: '11px' }}>⇅</span>;
    }
    return (
      <span style={{ marginLeft: '4px', color: '#2563eb', fontWeight: 'bold' }}>
        {currentDir === 'asc' ? '▲' : '▼'}
      </span>
    );
  };

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

    // Validate that tag name is between 3 and 30 characters long
    if (trimmedName.length < 3 || trimmedName.length > 30) {
      setError("Tag name must be between 3 and 30 characters long.");
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
        toast.success("Tag updated successfully.");
      } else {
        await tagApi.createTag(request);
        setSuccess("Tag created successfully.");
        toast.success("Tag created successfully.");
      }

      closeModal();
      await loadTags();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (tag: TagResponseDto) => {
    setDeleteConfirmConfig({
      isOpen: true,
      tag,
      loading: false,
    });
  };

  const executeDelete = async () => {
    if (!deleteConfirmConfig.tag) return;
    const tag = deleteConfirmConfig.tag;
    setDeleteConfirmConfig((prev) => ({ ...prev, loading: true }));
    setError("");
    setSuccess("");

    try {
      await tagApi.deleteTag(tag.tagId);
      toast.success(`Tag "${tag.tagName}" deleted successfully.`);
      setSuccess("Tag deleted successfully.");

      if (tags.length === 1 && page > 0) {
        setPage(page - 1);
      } else {
        await loadTags();
      }

      if (editingId === tag.tagId) {
        closeModal();
      }
      setDeleteConfirmConfig({
        isOpen: false,
        tag: null,
        loading: false,
      });
    } catch (err) {
      const msg = getErrorMessage(err);
      toast.error(msg);
      setError(msg);
      setDeleteConfirmConfig((prev) => ({ ...prev, loading: false, isOpen: false }));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="tag-page">
      {/* 1. Header (Catalogue Eyebrow + Title + Subtitle + Add Tag Button) */}
      <div className="tag-page-header">
        <div className="tag-header-left">
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            Tag Management
          </h1>

          <p className="text-xs text-slate-500">
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
            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                SORT:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: '#1e293b',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="tagId,desc">✨ Newest First (Default)</option>
                <option value="tagId,asc">Oldest First</option>
                <option value="tagName,asc">Tag Name (A - Z)</option>
                <option value="tagName,desc">Tag Name (Z - A)</option>
              </select>
            </div>

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
          <table className={`tag-table ${tags.length > 0 ? 'table-with-data' : 'table-empty'}`}>
            <thead>
              <tr>
                <th 
                  className="id-column text-center" 
                  style={{ width: '70px', textAlign: 'center', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSortToggle('tagId')}
                  title="Click to sort by ID"
                >
                  No. {renderSortIndicator('tagId')}
                </th>
                <th 
                  style={{ minWidth: '180px', textAlign: 'left', cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => handleSortToggle('tagName')}
                  title="Click to sort by Tag Name"
                >
                  TAG {renderSortIndicator('tagName')}
                </th>

                <th className="actions-column text-center" style={{ width: '180px', textAlign: 'center' }}>ACTIONS</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={3}>
                    <div className="loading-state">
                      <span className="large-spinner" />
                      <span>Loading tags...</span>
                    </div>
                  </td>
                </tr>
              ) : tags.length === 0 ? (
                <tr>
                  <td colSpan={3}>
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
                tags.map((tag, index) => { const rowNumber = page * PAGE_SIZE + index + 1; return (
                  <tr key={tag.tagId}>
                    <td className="id-cell" style={{ textAlign: 'center' }}>
                      {rowNumber}
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



                    <td className="text-center" style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}>
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
                  );
                })
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
                setPage(page - 1)
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
                setPage(page + 1)
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
                    placeholder="e.g. New Arrival (3 to 30 chars)"
                    minLength={3}
                    maxLength={30}
                    required
                    autoFocus
                  />
                  <span className="character-count">
                    {tagName.length}/30
                  </span>
                </div>

                <p className="field-help">
                  Use a short and descriptive name for your tag (3 to 30 characters).
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
          {/* Tag Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmConfig.isOpen}
        title="Delete Tag"
        message={`Are you sure you want to delete the tag "${deleteConfirmConfig.tag?.tagName || ''}"? Any products referencing this tag will no longer have it.`}
        confirmText="Delete Tag"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteConfirmConfig.loading}
        onConfirm={executeDelete}
        onClose={() => setDeleteConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}