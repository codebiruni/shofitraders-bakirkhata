"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface Props {
  href: string;
  label: string;
  icon: ReactNode;
  exact?: boolean;
}

export function SidebarNavLink({ href, label, icon, exact }: Props) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-primary/10 font-medium text-primary"
          : "text-ink hover:bg-base-200"
      )}
    >
      <span className="flex shrink-0 items-center justify-center [&_svg]:size-[18px]">
        {icon}
      </span>
      {label}
    </Link>
  );
}
