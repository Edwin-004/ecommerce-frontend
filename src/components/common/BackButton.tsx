import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import styles from './BackButton.module.css';

interface BackButtonProps {
  fallbackUrl?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

export const BackButton: React.FC<BackButtonProps> = ({
  fallbackUrl = '/admin/dashboard',
  onClick,
  label = 'Back',
  className = '',
  disabled = false,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onClick) {
      onClick();
      return;
    }
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
      disabled={disabled}
      className={`group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-medium text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 hover:border-slate-300 active:scale-95 transition-all duration-150 ${styles.backButton} ${className}`}
      title="Back to previous page"
      aria-label="Go back"
    >
      <FiArrowLeft className={`w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5 ${styles.backIcon}`} size={14} />
      <span className={styles.backLabel}>{label}</span>
    </button>
  );
};
