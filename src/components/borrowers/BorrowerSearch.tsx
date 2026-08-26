"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

export function BorrowerSearch() {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set("q", value.trim());
      else next.delete("q");
      const qs = next.toString();
      router.replace(qs ? `/borrowers?${qs}` : "/borrowers");
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full sm:max-w-sm">
      <MagnifyingGlass
        size={16}
        weight="regular"
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="নাম বা ফোন নম্বর দিয়ে খুঁজুন..."
        className="input input-bordered w-full rounded-md pl-9"
        aria-label="কাস্টমার খুঁজুন"
      />
    </div>
  );
}
