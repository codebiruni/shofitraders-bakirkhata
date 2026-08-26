"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "@phosphor-icons/react/dist/ssr";
import toast from "react-hot-toast";
import { createBorrower } from "@/app/actions/borrowers";

interface Props {
  /** When true, the parent already knows the new id and we just refresh. */
  onCreated?: (id: string) => void;
  buttonLabel?: string;
  triggerClassName?: string;
}

export function CreateBorrowerButton({
  onCreated,
  buttonLabel = "কাস্টমার যোগ করুন",
  triggerClassName,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      const result = await createBorrower(formData);
      if (result.ok) {
        toast.success("কাস্টমার সফলভাবে যোগ হয়েছে।");
        setOpen(false);
        form.reset();
        if (onCreated) onCreated(result.data.id);
        else router.push(`/borrowers/${result.data.id}`);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          "btn btn-primary btn-sm rounded-md gap-1.5"
        }
      >
        <Plus size={16} weight="regular" />
        {buttonLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="Close"
            className="modal-backdrop-in absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <form
            onSubmit={handleSubmit}
            className="modal-panel-in relative w-full max-w-md rounded-t-2xl border border-base-300 bg-base-100 p-6 shadow-2xl sm:rounded-2xl"
          >
            <h2 className="text-base font-semibold text-ink">নতুন কাস্টমার যোগ করুন</h2>
            <p className="mt-1 text-xs text-ink-soft">
              শুধু নাম আবশ্যক। বাকি সব ঐচ্ছিক।
            </p>

            <div className="mt-5 space-y-3">
              <label className="form-control w-full">
                <span className="label-text mb-1 text-xs font-medium text-ink-soft">
                  নাম <span className="text-error">*</span>
                </span>
                <input
                  name="name"
                  required
                  autoFocus
                  placeholder="যেমন: রহিম উদ্দিন"
                  className="input input-bordered w-full rounded-md"
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1 text-xs font-medium text-ink-soft">
                  ফোন নম্বর
                </span>
                <input
                  name="phone"
                  placeholder="যেমন: ০১৭১২-৩৪৫৬৭৮"
                  className="input input-bordered w-full rounded-md"
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text mb-1 text-xs font-medium text-ink-soft">
                  ঠিকানা
                </span>
                <input
                  name="address"
                  placeholder="ঐচ্ছিক"
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
                  placeholder="ঐচ্ছিক"
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
                onClick={() => setOpen(false)}
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
                {pending ? "সংরক্ষণ হচ্ছে..." : "কাস্টমার সংরক্ষণ করুন"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
