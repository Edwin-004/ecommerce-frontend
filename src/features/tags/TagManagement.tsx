import { useCallback, useEffect, useState } from "react";
import { isAxiosError } from "axios";

import { tagApi } from "./tagApi";

import type {
  TagRequestDto,
  TagResponseDto,
} from "../../types/tag";

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
   *
   * User types:
   * p -> ph -> pho -> phon -> phone
   *
   * API will only be called after user stops typing
   * for 400ms.
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
   *
   * Example:
   * Page 5 + search "phone"
   * -> go back to Page 1 for the search result.
   */
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch]);

  /**
   * Load tags from backend.
   *
   * Search is now handled by backend.
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

  const handleEdit = (tag: TagResponseDto) => {
    setEditingId(tag.tagId);
    setTagName(tag.tagName);
    setError("");
    setSuccess("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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

      resetForm();

      /**
       * After create/update:
       * reload current search result.
       */
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

      /**
       * If deleting the last item on the current page,
       * and this isn't the first page,
       * move back one page.
       */
      if (tags.length === 1 && page > 0) {
        setPage((currentPage) => currentPage - 1);
      } else {
        await loadTags();
      }

      if (editingId === tag.tagId) {
        resetForm();
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="tag-page">
      {/* Header */}
      <div className="tag-page-header">
        <div>
          <div className="tag-eyebrow">
            INVENTORY MANAGEMENT
          </div>

          <h1>Tag Management</h1>

          <p>
            Create and manage product tags across your inventory.
          </p>
        </div>

        <div className="tag-total-card">
          <span className="tag-total-label">Total Tags</span>
          <strong>{totalElements}</strong>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="alert alert-error">
          <span className="alert-icon">!</span>

          <div>
            <strong>Something went wrong</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            onClick={() => setError("")}
          >
            ×
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <span className="alert-icon">✓</span>

          <div>
            <strong>Success</strong>
            <p>{success}</p>
          </div>

          <button
            type="button"
            onClick={() => setSuccess("")}
          >
            ×
          </button>
        </div>
      )}

      {/* Create / Edit */}
      <section className="tag-form-card">
        <div className="section-heading">
          <div className="section-icon">
            {editingId !== null ? "✎" : "+"}
          </div>

          <div>
            <h2>
              {editingId !== null
                ? "Edit Tag"
                : "Create New Tag"}
            </h2>

            <p>
              {editingId !== null
                ? "Update the selected product tag."
                : "Add a new tag to organize your products."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="tagName">
              Tag Name
              <span>*</span>
            </label>

            <div
              className={`tag-input-wrapper ${
                editingId !== null ? "is-editing" : ""
              }`}
            >
              <span className="input-prefix">#</span>

              <input
                id="tagName"
                name="tagName"
                type="text"
                value={tagName}
                onChange={(event) =>
                  setTagName(event.target.value)
                }
                placeholder="e.g. New Arrival"
                maxLength={100}
                required
              />

              <span className="character-count">
                {tagName.length}/100
              </span>
            </div>

            <p className="field-help">
              Use a short and descriptive name for your tag.
            </p>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              disabled={saving}
              className="primary-button"
            >
              {saving ? (
                <>
                  <span className="spinner" />
                  Saving...
                </>
              ) : editingId !== null ? (
                <>
                  <span>✓</span>
                  Update Tag
                </>
              ) : (
                <>
                  <span>+</span>
                  Create Tag
                </>
              )}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="secondary-button"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {/* Tag Table */}
      <section className="tag-table-card">
        <div className="table-toolbar">
          <div>
            <h2>All Tags</h2>

            <p>
              {totalElements}{" "}
              {totalElements === 1 ? "tag" : "tags"} in your
              inventory
            </p>
          </div>

          <div className="table-toolbar-right">
            <div className="search-wrapper">
              <span className="search-icon">⌕</span>

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
                >
                  ×
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
              ↻
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

                      {debouncedSearch && (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                        >
                          Clear Search
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
                      <div className="row-actions">
                        <button
                          type="button"
                          className="icon-button edit-button"
                          onClick={() => handleEdit(tag)}
                          title="Edit tag"
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          className="icon-button delete-button"
                          onClick={() =>
                            void handleDelete(tag)
                          }
                          disabled={
                            deletingId === tag.tagId
                          }
                          title="Delete tag"
                        >
                          {deletingId === tag.tagId
                            ? "..."
                            : "⌫"}
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
            >
              ←
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
            >
              →
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}