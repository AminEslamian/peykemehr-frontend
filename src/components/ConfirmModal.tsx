import React, { useEffect } from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title = 'تأیید عملیات حذف',
  message,
  confirmText = 'حذف قطعی',
  cancelText = 'انصراف',
  variant = 'danger',
  loading = false,
  onConfirm,
  onCancel,
}) => {
  // Close on Escape key and prevent background scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-modal-overlay"
      onClick={() => {
        if (!loading) onCancel();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="confirm-modal-box"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="confirm-modal-close"
          title="بستن"
          aria-label="بستن"
        >
          <X size={18} />
        </button>

        {/* Header Icon */}
        <div className={`confirm-modal-icon-badge ${variant}`}>
          {variant === 'danger' ? (
            <Trash2 size={24} />
          ) : (
            <AlertTriangle size={24} />
          )}
        </div>

        {/* Title */}
        <h3 id="confirm-modal-title" className="confirm-modal-title">
          {title}
        </h3>

        {/* Message */}
        <p className="confirm-modal-message">
          {message}
        </p>

        {/* Actions */}
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="btn-astra btn-astra-outline"
            onClick={onCancel}
            disabled={loading}
            style={{ flex: 1, padding: '10px 18px', fontSize: '0.92rem' }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn-astra ${variant === 'danger' ? 'btn-astra-danger' : 'btn-astra-primary'}`}
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px 18px',
              fontSize: '0.92rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="spinner" />
                <span>در حال انجام...</span>
              </>
            ) : (
              <>
                {variant === 'danger' && <Trash2 size={16} />}
                <span>{confirmText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
