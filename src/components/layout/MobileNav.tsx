"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Users,
  Receipt,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/cn";
import { LogoutButton } from "@/components/auth/LogoutButton";

const NAV = [
  { href: "/", label: "ড্যাশবোর্ড", icon: House },
  { href: "/borrowers", label: "কাস্টমার", icon: Users },
  { href: "/transactions", label: "হিসাব", icon: Receipt },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-base-300 bg-base-100/90 px-4 py-3 backdrop-blur md:hidden">
        <div className="relative flex flex-col items-center">
          <span className="text-[11px] tracking-[0.18em] text-ink-soft">SHOFI TRADERS</span>
          <span className="text-sm font-semibold text-ink">বাকির খাতা</span>
          <LogoutButton className="absolute right-0 top-1/2 -translate-y-1/2 px-2 py-1.5 text-xs" />
        </div>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-base-300 bg-base-100/95 backdrop-blur md:hidden">
        <ul className="mx-auto grid w-full max-w-md grid-cols-3 px-2 pb-[max(env(safe-area-inset-bottom),0.4rem)] pt-1.5">
          {NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 rounded-md px-2 py-1.5 text-[11px] transition-colors",
                    active
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-ink-soft hover:bg-base-200 hover:text-ink"
                  )}
                >
                  <Icon size={18} weight="regular" />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

// curl "http://api.sonalisms.com:7788/sendtext?apikey=20b34eeef4440e25&secretkey=801010a1&callerID=01764047140&toUser=8801311392727&messageContent=Test+message+from+Shofi+Traders"