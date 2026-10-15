import React from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import styles from './Pagination.module.css';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems?: number;
  totalResults?: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  totalResults,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
}) => {
  const count = totalResults ?? totalItems ?? 0;
  if (count <= 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, count);


  // Generate page numbers with ellipses
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={styles.paginationWrapper}>
      <div className={styles.infoText}>
        Showing <span className={styles.highlight}>{startItem}</span> to{' '}
        <span className={styles.highlight}>{endItem}</span> of{' '}
        <span className={styles.highlight}>{count}</span> results
      </div>


      <div className={styles.controlsGroup}>
        {onPageSizeChange && (
          <div className={styles.pageSizeSelector}>
            <label htmlFor="pageSizeSelect">Rows:</label>
            <select
              id="pageSizeSelect"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={styles.sizeSelect}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className={styles.btnPagesGroup}>
          <button
            type="button"
            className={styles.navBtn}
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            aria-label="Previous Page"
            title="Previous Page"
          >
            <FiChevronLeft size={16} />
            <span className={styles.btnLabel}>Prev</span>
          </button>

          {getPageNumbers().map((p, idx) =>
            typeof p === 'number' ? (
              <button
                key={idx}
                type="button"
                className={`${styles.pageNumberBtn} ${
                  currentPage === p ? styles.activePage : ''
                }`}
                onClick={() => onPageChange(p)}
              >
                {p}
              </button>
            ) : (
              <span key={idx} className={styles.ellipsis}>
                {p}
              </span>
            )
          )}

          <button
            type="button"
            className={styles.navBtn}
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            aria-label="Next Page"
            title="Next Page"
          >
            <span className={styles.btnLabel}>Next</span>
            <FiChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
