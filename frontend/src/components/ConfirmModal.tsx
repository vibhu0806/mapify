import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Reset',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-surface border border-border-subtle rounded-lg shadow-2xl p-6 text-left">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-accent-amberMuted text-accent-amber">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-medium text-primary font-sans">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-primary-dim hover:text-primary transition-colors p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-sm text-primary-muted leading-relaxed mb-6 font-sans">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 font-mono text-xs">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded border border-border-subtle bg-surface-card hover:bg-surface-hover text-primary-muted hover:text-primary transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded bg-accent-red/20 border border-accent-red/40 hover:bg-accent-red/30 text-accent-red font-medium transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
