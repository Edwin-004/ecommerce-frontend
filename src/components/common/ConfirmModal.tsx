import React, { useEffect } from 'react';
import { FiAlertTriangle, FiTrash2, FiInfo, FiCheckCircle, FiX } from 'react-icons/fi';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: '#fee2e2',
          iconColor: '#dc2626',
          icon: <FiTrash2 size={24} />,
          btnBg: '#dc2626',
          btnHover: '#b91c1c',
          defaultTitle: 'Are you sure?',
        };
      case 'warning':
        return {
          iconBg: '#fef3c7',
          iconColor: '#d97706',
          icon: <FiAlertTriangle size={24} />,
          btnBg: '#d97706',
          btnHover: '#b45309',
          defaultTitle: 'Attention Required',
        };
      case 'success':
        return {
          iconBg: '#dcfce7',
          iconColor: '#16a34a',
          icon: <FiCheckCircle size={24} />,
          btnBg: '#16a34a',
          btnHover: '#15803d',
          defaultTitle: 'Confirm Action',
        };
      case 'info':
      default:
        return {
          iconBg: '#e0e7ff',
          iconColor: '#4f46e5',
          icon: <FiInfo size={24} />,
          btnBg: '#4f46e5',
          btnHover: '#4338ca',
          defaultTitle: 'Notice',
        };
    }
  };

  const v = getVariantStyles();

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '16px',
        backdropFilter: 'blur(4px)',
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={!isLoading ? onClose : undefined}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '440px',
          padding: '24px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FiX size={18} />
        </button>

        {/* Icon Circle */}
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: v.iconBg,
            color: v.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          {v.icon}
        </div>

        {/* Title & Message */}
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '18px',
            fontWeight: 700,
            color: '#0f172a',
          }}
        >
          {title || v.defaultTitle}
        </h3>
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            lineHeight: 1.5,
            color: '#64748b',
          }}
        >
          {message}
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            width: '100%',
            justifyContent: 'center',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              background: '#f8fafc',
              color: '#334155',
              fontWeight: 600,
              fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              background: v.btnBg,
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {isLoading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
