"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperPlaneTilt, Warning, CheckCircle, XCircle } from "@phosphor-icons/react/dist/ssr";
import toast from "react-hot-toast";
import { sendBulkMessage, type BulkMessageResult } from "@/app/actions/messages";

const MAX_LENGTH = 1000;

export interface MessageRecipient {
  _id: string;
  name: string;
  phone?: string;
}

interface Props {
  recipients: MessageRecipient[];
  /** Customers that will be skipped because they have no phone number. */
  withoutPhone?: number;
  smsConfigured: boolean;
}

/**
 * Estimate how many SMS parts a message will use.
 * Bengali text is sent as UCS-2 (70 chars/part), plain ASCII as GSM-7
 * (160 chars/part, 153 when concatenated).
 */
function smsInfo(text: string): { length: number; segments: number; unicode: boolean } {
  const length = [...text].length;
  if (length === 0) return { length: 0, segments: 0, unicode: false };
  const unicode = /[^\x00-\x7F]/.test(text);
  const single = unicode ? 70 : 160;
  const multi = unicode ? 67 : 153;
  const segments = length <= single ? 1 : Math.ceil(length / multi);
  return { length, segments, unicode };
}

export function MessageComposer({ recipients, withoutPhone = 0, smsConfigured }: Props) {
  const [message, setMessage] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<BulkMessageResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const info = useMemo(() => smsInfo(message.trim()), [message]);
  const recipientCount = recipients.length;
  const canSend = smsConfigured && recipientCount > 0 && message.trim().length > 0;

  const handleConfirm = () => {
    setError(null);
    const formData = new FormData();
    formData.set("message", message.trim());

    startTransition(async () => {
      const res = await sendBulkMessage(formData);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setConfirmOpen(false);
      setResult(res.data);
      if (res.data.failed === 0) {
        // Clear the box only on a fully successful send, so the same message
        // cannot be sent to every customer twice by accident.
        setMessage("");
        toast.success(`${res.data.sent} জন কাস্টমারকে মেসেজ পাঠানো হয়েছে।`);
      } else {
        toast.error(
          `${res.data.sent}টি পাঠানো হয়েছে, ${res.data.failed}টি ব্যর্থ হয়েছে।`
        );
      }
      router.refresh();
    });
  };

  return (
    <section className="ledger-card p-5 md:p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold text-ink">মেসেজ লিখুন</h2>
        <p className="text-xs text-ink-soft">
          একবার লিখলেই মেসেজটি ফোন নম্বর থাকা সব কাস্টমারের কাছে চলে যাবে।
        </p>
      </div>

      {!smsConfigured && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5 text-xs text-warning">
          <Warning size={16} weight="regular" className="mt-0.5 shrink-0" />
          <span>
            SMS সেবা চালু নেই। <code className="font-mono">.env.local</code>{" "}
            ফাইলে <code className="font-mono">SMS_API_KEY</code>,{" "}
            <code className="font-mono">SMS_SECRET_KEY</code> ও{" "}
            <code className="font-mono">SMS_CALLER_ID</code> যোগ করলে মেসেজ পাঠানো যাবে।
          </span>
        </div>
      )}

      <div className="mt-4">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value.slice(0, MAX_LENGTH))}
          rows={5}
          maxLength={MAX_LENGTH}
          placeholder="যেমন: শুভ নববর্ষ! শফি ট্রেডার্সের সাথে থাকার জন্য ধন্যবাদ।"
          className="textarea textarea-bordered w-full rounded-md leading-relaxed"
          disabled={pending}
        />
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-soft">
          <span>
            {info.length}/{MAX_LENGTH} অক্ষর
            {info.segments > 0 && (
              <>
                {" · "}
                {info.segments}টি SMS {info.unicode ? "(বাংলা)" : ""}
              </>
            )}
          </span>
          <span>
            প্রাপক: <span className="font-medium text-ink">{recipientCount}</span> জন
          </span>
        </div>
      </div>

      {error && (
        <p className="mt-3 rounded-md border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
          {error}
        </p>
      )}

      {result && (
        <div
          className={`mt-4 rounded-md border px-3 py-2.5 text-xs ${result.failed === 0
            ? "border-success/30 bg-success/10 text-success"
            : "border-warning/30 bg-warning/10 text-warning"
            }`}
        >
          <p className="flex items-center gap-1.5 font-medium">
            {result.failed === 0 ? (
              <CheckCircle size={14} weight="regular" />
            ) : (
              <XCircle size={14} weight="regular" />
            )}
            ফলাফল: {result.sent}টি পাঠানো হয়েছে
            {result.failed > 0 ? `, ${result.failed}টি ব্যর্থ` : ""}
            {result.skipped > 0 ? `, ${result.skipped}টি বাদ` : ""}।
          </p>
          {result.failedNames.length > 0 && (
            <p className="mt-1 opacity-90">
              ব্যর্থ: {result.failedNames.join(", ")}
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-ink-soft">
          {recipientCount === 0
            ? "ফোন নম্বরসহ কোনো কাস্টমার নেই।"
            : `মেসেজ যাবে ${recipientCount} জন কাস্টমারের কাছে।`}
          {recipientCount > 0 && withoutPhone > 0 && (
            <>
              {" "}
              <span className="text-warning">
                ({withoutPhone} জনের ফোন নম্বর নেই, তাঁরা বাদ পড়বেন।)
              </span>
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={!canSend || pending}
          className="btn btn-primary rounded-md gap-1.5"
        >
          <PaperPlaneTilt size={16} weight="regular" />
          {pending ? "পাঠানো হচ্ছে..." : "সবাইকে পাঠান"}
        </button>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            aria-label="বন্ধ করুন"
            className="modal-backdrop-in absolute inset-0 bg-black/50"
            onClick={() => !pending && setConfirmOpen(false)}
          />
          <div className="modal-panel-in relative w-full max-w-md rounded-t-2xl border border-base-300 bg-base-100 p-6 shadow-2xl sm:rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PaperPlaneTilt size={20} weight="regular" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-semibold text-ink">
                  সব কাস্টমারকে পাঠাবেন?
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  এই মেসেজটি <span className="font-medium text-ink">{recipientCount} জন</span>{" "}
                  কাস্টমারের কাছে SMS হিসেবে পাঠানো হবে। এটি ফেরানো যাবে না।
                </p>
              </div>
            </div>

            <div className="mt-4 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-md border border-base-300 bg-base-200/40 px-3 py-2 text-sm text-ink">
              {message.trim()}
            </div>

            {error && (
              <p className="mt-3 rounded-md border border-error/20 bg-error/5 px-3 py-2 text-xs text-error">
                {error}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                className="btn btn-ghost rounded-md"
                onClick={() => setConfirmOpen(false)}
                disabled={pending}
              >
                বাতিল
              </button>
              <button
                type="button"
                className="btn btn-primary rounded-md"
                onClick={handleConfirm}
                disabled={pending}
              >
                {pending ? "পাঠানো হচ্ছে..." : "হ্যাঁ, পাঠান"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
