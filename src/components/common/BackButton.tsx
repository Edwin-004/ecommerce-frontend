import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import styles from './BackButton.module.css';

interface BackButtonProps {
  fallbackUrl?: string;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  fallbackUrl = '/admin/dashboard',
  label = 'Back',
  className = '',
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // If there is previous history in this session, navigate back safely; otherwise go to fallback
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate(fallbackUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleBack}
      className={`${styles.backButton} ${className}`}
      title="Back to previous page"
      aria-label="Go back"
    >
      <FiArrowLeft className={styles.backIcon} size={15} />
      <span className={styles.backLabel}>{label}</span>
    </button>
  );
};
