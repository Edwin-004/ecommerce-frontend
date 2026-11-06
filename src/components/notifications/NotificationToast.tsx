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

  const isRefund =
    notification.type === 'REFUND_REQUEST' ||
    notification.type?.toUpperCase().includes('REFUND') ||
    notification.title?.toLowerCase().includes('refund') ||
    notification.link?.includes('/admin/refunds');

  const handleClick = () => {
    if (onRead && notification.notificationId) {
      onRead(notification.notificationId);
    }
    onClose();
    if (isRefund) {
      navigate('/admin/refunds');
    } else if (notification.link && notification.link !== '/admin/refunds') {
      if (notification.link.startsWith('/admin/orders/')) {
        const extractedOrderNo = notification.link.split('/').pop();
        navigate(`/admin/orders?orderNo=${extractedOrderNo}`);
      } else {
        navigate(notification.link);
      }
    }
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
            <span className={styles.toastBadge}>
              {isRefund ? 'REFUND REQUEST' : notification.type || 'EVENT'}
            </span>
            <span className={styles.toastTime}>Just now</span>
          </div>
          <h4 className={styles.toastTitle}>{notification.title}</h4>
          <p className={styles.toastMessage}>{notification.message}</p>
          <div className={styles.toastActionPrompt}>
            {isRefund ? (
              <>
                <span>Click to review request in Refunds</span>
                <FiArrowRight size={13} />
              </>
            ) : notification.link ? (
              <>
                <span>Click to view details</span>
                <FiArrowRight size={13} />
              </>
            ) : (
              <span>Notification received</span>
            )}
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
