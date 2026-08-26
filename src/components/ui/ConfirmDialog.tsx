"use client";

import { useState, useTransition } from "react";
import { Warning } from "@phosphor-icons/react/dist/ssr";

interface Props {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => Promise<{ ok: boolean; error?: string }> | { ok: boolean; error?: string };
  onClose: () => void;
  successMessage?: string;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "মুছুন",
  cancelLabel = "বাতিল",
  destructive = true,
  onConfirm,
  onClose,
  successMessage,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await onConfirm();
        if (res.ok) {
          onClose();
        } else {
          setError(res.error ?? "কিছু ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
        }
      } catch (err) {
        console.error("[ConfirmDialog] confirm failed", err);
        setError("কিছু ভুল হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
      }
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="ডায়ালগ বন্ধ করুন"
        className="modal-backdrop-in absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div className="modal-panel-in relative w-full max-w-md rounded-t-2xl border border-base-300 bg-base-100 p-6 shadow-2xl sm:rounded-2xl">
        <div className="flex items-start gap-3">
          <div
            className={
              destructive
                ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-error/10 text-error"
                : "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
            }
          >
            <Warning size={20} weight="regular" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description && (
              <div className="mt-1 text-sm text-ink-soft">{description}</div>
            )}
            {error && (
              <p className="mt-3 rounded-md border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
                {error}
              </p>
            )}
            {pending && successMessage === undefined && (
              <p className="mt-3 text-xs text-ink-soft">কাজ চলছে…</p>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="btn btn-ghost rounded-md"
            onClick={onClose}
            disabled={pending}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={
              destructive
                ? "btn btn-error rounded-md text-error-content"
                : "btn btn-primary rounded-md"
            }
            onClick={handleConfirm}
            disabled={pending}
          >
            {pending ? "কাজ চলছে…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
