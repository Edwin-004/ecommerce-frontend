import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiX, FiRefreshCcw, FiArrowRight } from 'react-icons/fi';
import styles from './Notifications.module.css';
import { type AdminNotificationItem } from '../../services/notificationApi';

interface NotificationToastProps {
  notification: AdminNotificationItem;
  onClose: () => void;
  onRead?: (id: number) => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  notification,
  onClose,
  onRead,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onRead && notification.notificationId) {
      onRead(notification.notificationId);
    }
    onClose();
    navigate(notification.link || '/admin/refunds');
  };

  return (
    <div className={styles.toastContainer} onClick={handleClick}>
      <div className={styles.toastGlowBar} />
      <div className={styles.toastContent}>
        <div className={styles.toastIconWrapper}>
          <FiRefreshCcw className={styles.toastIcon} />
        </div>
        <div className={styles.toastTextWrapper}>
          <div className={styles.toastHeaderRow}>
            <span className={styles.toastBadge}>STOREFRONT EVENT</span>
            <span className={styles.toastTime}>Just now</span>
          </div>
          <h4 className={styles.toastTitle}>{notification.title}</h4>
          <p className={styles.toastMessage}>{notification.message}</p>
          <div className={styles.toastActionPrompt}>
            <span>Click to review request</span>
            <FiArrowRight size={13} />
          </div>
        </div>
        <button
          type="button"
          className={styles.toastCloseBtn}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close notification"
        >
          <FiX size={15} />
        </button>
      </div>
    </div>
  );
};
