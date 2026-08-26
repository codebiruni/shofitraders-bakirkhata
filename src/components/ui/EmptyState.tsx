"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";

interface Props {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-base-300 bg-white px-6 py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-ink">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-ink-soft">{description}</p>
      )}
      {action ? (
        <div className="mt-5">{action}</div>
      ) : actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="btn btn-primary btn-sm mt-5 rounded-md"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
