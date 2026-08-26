"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eye, PencilSimple, Trash } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import toast from "react-hot-toast";
import { deleteBorrower, updateBorrower } from "@/app/actions/borrowers";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Props {
  borrowerId: string;
  borrowerName: string;
}

export function BorrowerRowActions({ borrowerId, borrowerName }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-end gap-1">
        <Link
          href={`/borrowers/${borrowerId}`}
          aria-label={`${borrowerName} এর প্রোফাইল দেখুন`}
          className="btn btn-ghost btn-xs rounded-md"
        >
          <Eye size={16} weight="regular" />
          <span className="hidden sm:inline">দেখুন</span>
        </Link>
        <button
          type="button"
          aria-label={`${borrowerName} এডিট করুন`}
          onClick={() => setEditing(true)}
          className="btn btn-ghost btn-xs rounded-md"
        >
          <PencilSimple size={16} weight="regular" />
          <span className="hidden sm:inline">এডিট</span>
        </button>
        <button
          type="button"
          aria-label={`${borrowerName} মুছে ফেলুন`}
          onClick={() => setConfirmOpen(true)}
          className="btn btn-ghost btn-xs rounded-md text-error hover:bg-error/10"
        >
          <Trash size={16} weight="regular" />
          <span className="hidden sm:inline">মুছুন</span>
        </button>
      </div>

      {editing && (
        <EditBorrowerDialog
          borrowerId={borrowerId}
          open={editing}
          onClose={() => setEditing(false)}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="কাস্টমার মুছবেন?"
        description={
          <>
            <strong>{borrowerName}</strong> কে মুছে ফেললে তাঁর সব হিসাবের ইতিহাসও মুছে যাবে।
            এই কাজ আর ফেরানো যাবে না।
          </>
        }
        confirmLabel="কাস্টমার মুছুন"
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          const res = await deleteBorrower(borrowerId);
          if (res.ok) {
            toast.success("কাস্টমার মুছে ফেলা হয়েছে।");
            router.refresh();
            return { ok: true };
          }
          return { ok: false, error: res.error };
        }}
      />
    </>
  );
}

function EditBorrowerDialog({
  borrowerId,
  open,
  onClose,
}: {
  borrowerId: string;
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Lazy-load borrower for editing
  useEffect(() => {
    if (!open || loaded) return;
    let cancelled = false;
    fetch(`/api/borrowers/${borrowerId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data) {
          setName(data.name ?? "");
          setPhone(data.phone ?? "");
          setAddress(data.address ?? "");
          setNotes(data.notes ?? "");
        }
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, borrowerId, loaded]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateBorrower(borrowerId, formData);
      if (res.ok) {
        toast.success("কাস্টমারের তথ্য সফলভাবে আপডেট হয়েছে।");
        onClose();
        router.refresh();
      } else {
        setError(res.error);
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
        aria-label="Close"
        className="modal-backdrop-in absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="modal-panel-in relative w-full max-w-md rounded-t-2xl border border-base-300 bg-base-100 p-6 shadow-2xl sm:rounded-2xl"
      >
        <h2 className="text-base font-semibold text-ink">কাস্টমারের তথ্য এডিট</h2>

        <div className="mt-5 space-y-3">
          <label className="form-control w-full">
            <span className="label-text mb-1 text-xs font-medium text-ink-soft">
              নাম <span className="text-error">*</span>
            </span>
            <input
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input input-bordered w-full rounded-md"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text mb-1 text-xs font-medium text-ink-soft">
              ফোন নম্বর
            </span>
            <input
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input input-bordered w-full rounded-md"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text mb-1 text-xs font-medium text-ink-soft">
              ঠিকানা
            </span>
            <input
              name="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input input-bordered w-full rounded-md"
            />
          </label>
          <label className="form-control w-full">
            <span className="label-text mb-1 text-xs font-medium text-ink-soft">
              নোট
            </span>
            <textarea
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="textarea textarea-bordered w-full rounded-md"
            />
          </label>
        </div>

        {error && (
          <p className="mt-3 rounded-md border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost rounded-md"
            disabled={pending}
          >
            বাতিল
          </button>
          <button
            type="submit"
            className="btn btn-primary rounded-md"
            disabled={pending}
          >
            {pending ? "সংরক্ষণ হচ্ছে…" : "পরিবর্তন সংরক্ষণ করুন"}
          </button>
        </div>
      </form>
    </div>
  );
}
