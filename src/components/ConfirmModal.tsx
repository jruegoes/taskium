interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 bg-overlay z-[80] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-card-bg border border-border rounded-xl p-6 w-full max-w-sm shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg text-text mb-2">{title}</h2>
        <p className="text-sm text-text-muted mb-6">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 bg-danger text-white rounded-lg px-4 py-2 hover:bg-danger-hover transition-colors"
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 border border-border rounded-lg px-4 py-2 hover:bg-hover transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
