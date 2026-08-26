"use client";

import { signOut } from "next-auth/react";
import { SignOut } from "@phosphor-icons/react";
import { cn } from "@/lib/cn";

export function LogoutButton({ className }: { className?: string }) {
    return (
        <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-soft transition-colors hover:bg-base-200 hover:text-ink",
                className
            )}
            aria-label="লগ আউট"
        >
            <SignOut size={18} weight="regular" />
            <span>লগ আউট</span>
        </button>
    );
}
