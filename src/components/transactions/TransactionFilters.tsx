"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import dayjs from "dayjs";

type TypeFilter = "all" | "borrowed" | "payment";

export function TransactionFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") ?? "");

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (search.trim()) next.set("q", search.trim());
      else next.delete("q");
      router.replace(`${pathname}?${next.toString()}`);
    }, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const type: TypeFilter =
    (params.get("type") as TypeFilter) || "all";

  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";

  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value && value.length > 0) next.set(key, value);
    else next.delete(key);
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "borrowed", "payment"] as const).map((opt) => {
          const active = type === opt;
          const label =
            opt === "all" ? "সব" : opt === "borrowed" ? "বাকি" : "জমা";
          return (
            <button
              key={opt}
              type="button"
              onClick={() => updateParam("type", opt === "all" ? null : opt)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${active
                ? "border-primary bg-primary text-primary-content"
                : "border-base-300 bg-base-100 text-ink hover:bg-base-200"
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="relative sm:max-w-xs">
          <MagnifyingGlass
            size={16}
            weight="regular"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="কাস্টমারের নাম খুঁজুন..."
            className="input input-bordered w-full rounded-md pl-9"
            aria-label="কাস্টমার খুঁজুন"
          />
        </div>
        <input
          type="date"
          value={from}
          max={to || undefined}
          onChange={(e) => updateParam("from", e.target.value || null)}
          className="input input-bordered w-full rounded-md"
          aria-label="শুরুর তারিখ"
        />
        <input
          type="date"
          value={to}
          min={from || undefined}
          max={dayjs().format("YYYY-MM-DD")}
          onChange={(e) => updateParam("to", e.target.value || null)}
          className="input input-bordered w-full rounded-md"
          aria-label="শেষ তারিখ"
        />
      </div>
    </div>
  );
}
