"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Warning } from "@phosphor-icons/react/dist/ssr";

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error("[shofi] page error:", error);
    }, [error]);

    return (
        <div className="mx-auto flex max-w-md flex-col items-center px-4 py-20 text-center">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-error/10 text-error">
                <Warning size={28} weight="regular" />
            </div>
            <h1 className="text-lg font-semibold text-ink">কিছু ভুল হয়েছে</h1>
            <p className="mt-1 text-sm text-ink-soft">
                {error.message.includes("MONGODB_URI")
                    ? "ডাটাবেস এখনো সেটআপ করা হয়নি। বাকির খাতা ব্যবহার করতে .env.local ফাইলে MONGODB_URI যোগ করুন।"
                    : "এই পেজটি লোড করা সম্ভব হচ্ছে না। অনুগ্রহ করে আবার চেষ্টা করুন।"}
            </p>
            <div className="mt-6 flex gap-2">
                <button
                    type="button"
                    onClick={reset}
                    className="btn btn-primary btn-sm rounded-md"
                >
                    আবার চেষ্টা করুন
                </button>
                <Link href="/" className="btn btn-ghost btn-sm rounded-md">
                    ড্যাশবোর্ডে যান
                </Link>
            </div>
        </div>
    );
}
