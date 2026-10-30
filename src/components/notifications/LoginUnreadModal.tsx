import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiX, FiCheckCircle, FiArrowRight } from 'react-icons/fi';
import styles from './Notifications.module.css';
import { type AdminNotificationItem } from '../../services/notificationApi';

interface LoginUnreadModalProps {
  unreadCount: number;
  items: AdminNotificationItem[];
  onClose: () => void;
  onMarkAllAsRead: () => void;
}

export const LoginUnreadModal: React.FC<LoginUnreadModalProps> = ({
  unreadCount,
  items,
  onClose,
  onMarkAllAsRead,
}) => {
  const navigate = useNavigate();

  const handleReviewAll = () => {
    onMarkAllAsRead();
    onClose();
    navigate('/admin/refunds');
  };

  const handleItemClick = (item: AdminNotificationItem) => {
    onClose();
    navigate(item.link || '/admin/refunds');
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.bellIconCircle}>
              <FiBell size={20} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>Unread Notifications</h3>
              <p className={styles.modalSubtitle}>
                You have <strong>{unreadCount}</strong> unread refund request{unreadCount !== 1 ? 's' : ''} awaiting admin review.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.modalCloseBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Unread Items List Preview */}
        <div className={styles.modalBody}>
          <div className={styles.itemsList}>
            {items.slice(0, 5).map((item) => (
              <div
                key={item.notificationId}
                className={styles.unsetItemCard}
                onClick={() => handleItemClick(item)}
              >
                <div className={styles.unsetItemLeft}>
                  <div className={styles.unreadIndicatorDot} />
                  <div>
                    <div className={styles.unsetItemTitle}>{item.title}</div>
                    <div className={styles.unsetItemDesc}>{item.message}</div>
                  </div>
                </div>
                <div className={styles.unsetItemArrow}>
                  <FiArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>

          {unreadCount > 5 && (
            <p className={styles.moreCountText}>
              + {unreadCount - 5} more pending requests in queue
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.btnDismiss}
            onClick={onClose}
          >
            Dismiss
          </button>
          <button
            type="button"
            className={styles.btnReviewNow}
            onClick={handleReviewAll}
          >
            <FiCheckCircle size={15} />
            <span>Review Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
