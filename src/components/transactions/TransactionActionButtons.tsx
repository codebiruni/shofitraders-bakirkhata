"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus } from "@phosphor-icons/react/dist/ssr";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import { addBorrowing, recordPayment } from "@/app/actions/transactions";

interface Props {
  borrowerId: string;
  outstanding: number;
  defaultOpen?: "borrow" | "payment" | null;
  onClose?: () => void;
}

export function TransactionActionButtons({
  borrowerId,
  outstanding,
  defaultOpen,
  onClose,
}: Props) {
  const [open, setOpen] = useState<"borrow" | "payment" | null>(
    defaultOpen ?? null
  );

  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <button
        type="button"
        onClick={() => setOpen("borrow")}
        className="btn btn-primary btn-sm rounded-md gap-1.5"
      >
        <Plus size={16} weight="regular" />
        বাকি যোগ করুন
      </button>
      <button
        type="button"
        onClick={() => setOpen("payment")}
        className="btn btn-outline btn-sm rounded-md gap-1.5 border-primary text-primary hover:bg-primary hover:text-primary-content"
      >
        <Minus size={16} weight="regular" />
        টাকা জমা দিন
      </button>

      {open === "borrow" && (
        <BorrowingDialog
          borrowerId={borrowerId}
          onClose={() => {
            setOpen(null);
            onClose?.();
          }}
        />
      )}
      {open === "payment" && (
        <PaymentDialog
          borrowerId={borrowerId}
          outstanding={outstanding}
          onClose={() => {
            setOpen(null);
            onClose?.();
          }}
        />
      )}
    </div>
  );
}

function BorrowingDialog({
  borrowerId,
  onClose,
}: {
  borrowerId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const today = dayjs().format("YYYY-MM-DDTHH:mm");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("borrowerId", borrowerId);
    startTransition(async () => {
      const res = await addBorrowing(formData);
      if (res.ok) {
        toast.success("বাকির হিসাব সফলভাবে যোগ হয়েছে।");
        onClose();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <ModalShell title="বাকি যোগ করুন" onClose={onClose} disabled={pending}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="টাকা" required prefix="৳">
          <input
            name="amount"
            type="number"
            inputMode="decimal"
            min="1"
            step="1"
            required
            autoFocus
            placeholder="0"
            className="input input-bordered w-full rounded-md pl-7"
          />
        </Field>
        <Field label="তারিখ ও সময়">
          <input
            name="date"
            type="datetime-local"
            defaultValue={today}
            max={today}
            required
            className="input input-bordered w-full rounded-md"
          />
        </Field>
        <Field label="নোট">
          <input
            name="note"
            placeholder="ঐচ্ছিক"
            className="input input-bordered w-full rounded-md"
          />
        </Field>
        {error && <ErrorBox message={error} />}
        <ModalActions
          onClose={onClose}
          pending={pending}
          submitLabel="বাকি সংরক্ষণ করুন"
        />
      </form>
    </ModalShell>
  );
}

function PaymentDialog({
  borrowerId,
  outstanding,
  onClose,
}: {
  borrowerId: string;
  outstanding: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const today = dayjs().format("YYYY-MM-DDTHH:mm");

  const numericAmount = Number(amount.replace(/[,\s৳]/g, "")) || 0;
  const exceeds = numericAmount - outstanding > 0.0001 && outstanding > 0;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    formData.set("borrowerId", borrowerId);
    startTransition(async () => {
      const res = await recordPayment(formData);
      if (res.ok) {
        toast.success("টাকা জমা সফলভাবে রেকর্ড হয়েছে।");
        onClose();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  };

  return (
    <ModalShell title="টাকা জমা দিন" onClose={onClose} disabled={pending}>
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="টাকা" required prefix="৳">
          <input
            name="amount"
            type="number"
            inputMode="decimal"
            min="1"
            step="1"
            required
            autoFocus
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="input input-bordered w-full rounded-md pl-7"
          />
        </Field>
        {exceeds && (
          <p className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
            টাকা জমার পরিমাণ বর্তমান পাওনার (৳
            {new Intl.NumberFormat("en-IN").format(Math.round(outstanding))})
            চেয়ে বেশি হয়ে যাচ্ছে।
          </p>
        )}
        <Field label="তারিখ ও সময়">
          <input
            name="date"
            type="datetime-local"
            defaultValue={today}
            max={today}
            required
            className="input input-bordered w-full rounded-md"
          />
        </Field>
        <Field label="মাধ্যম" required>
          <select
            name="paymentMethod"
            required
            defaultValue="cash"
            className="select select-bordered w-full rounded-md"
          >
            <option value="cash">ক্যাশ</option>
            <option value="bkash">বিকাশ</option>
            <option value="nagad">নগদ</option>
            <option value="bank">ব্যাংক</option>
            <option value="other">অন্যান্য</option>
          </select>
        </Field>
        <Field label="নোট">
          <input
            name="note"
            placeholder="ঐচ্ছিক"
            className="input input-bordered w-full rounded-md"
          />
        </Field>
        {error && <ErrorBox message={error} />}
        <ModalActions
          onClose={onClose}
          pending={pending}
          submitLabel="টাকা জমা সংরক্ষণ করুন"
        />
      </form>
    </ModalShell>
  );
}

function ModalShell({
  title,
  onClose,
  disabled,
  children,
}: {
  title: string;
  onClose: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
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
        disabled={disabled}
      />
      <div className="modal-panel-in relative w-full max-w-md rounded-t-2xl border border-base-300 bg-base-100 p-6 shadow-2xl sm:rounded-2xl">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  prefix,
  children,
}: {
  label: string;
  required?: boolean;
  prefix?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="form-control w-full">
      <span className="label-text mb-1 text-xs font-medium text-ink-soft">
        {label}
        {required && <span className="text-error"> *</span>}
      </span>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-soft">
            {prefix}
          </span>
        )}
        {children}
      </div>
    </label>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <p className="rounded-md border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
      {message}
    </p>
  );
}

function ModalActions({
  onClose,
  pending,
  submitLabel,
}: {
  onClose: () => void;
  pending: boolean;
  submitLabel: string;
}) {
  return (
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
        {pending ? "সংরক্ষণ হচ্ছে…" : submitLabel}
      </button>
    </div>
  );
}
