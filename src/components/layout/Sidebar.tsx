import Link from "next/link";
import { SidebarNavLink } from "./SidebarNavLink";
import { LogoutButton } from "@/components/auth/LogoutButton";

const NAV = [
  { href: "/", label: "ড্যাশবোর্ড", iconKey: "dashboard", exact: true },
  { href: "/borrowers", label: "কাস্টমার", iconKey: "borrowers" },
  { href: "/transactions", label: "হিসাব", iconKey: "transactions" },
  { href: "/invoices", label: "Invoices", iconKey: "invoices" },
  { href: "/messages", label: "মেসেজ", iconKey: "messages" },
] as const;

export function Sidebar() {
  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col border-r border-base-300 bg-base-100 md:sticky md:top-0 md:flex">
      <div className="border-b border-base-300 px-6 py-7">
        <Link href="/" className="block">
          <p className="text-[11px] font-medium tracking-[0.22em] text-ink-soft">
            SHOFI TRADERS
          </p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-ink">
            বাকির খাতা
          </p>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {NAV.map((item) => (
            <li key={item.href}>
              <SidebarNavLink
                href={item.href}
                label={item.label}
                icon={<NavIcon name={item.iconKey} />}
                exact={"exact" in item ? item.exact : false}
              />
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-base-300 px-6 py-5">
        <p className="text-[11px] font-medium tracking-[0.22em] text-ink-soft">
          ব্যক্তিগত হিসাব
        </p>
        <p className="mt-1 text-xs text-ink-soft/80">
          একটি সহজ বাকির খাতা।
        </p>
        <LogoutButton className="mt-3 -ml-3" />
      </div>
    </aside>
  );
}

function NavIcon({ name }: { name: "dashboard" | "borrowers" | "transactions" | "invoices" | "messages" }) {
  if (name === "dashboard") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 11l9-8 9 8" />
        <path d="M5 10v10h14V10" />
      </svg>
    );
  }
  if (name === "borrowers") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20a6.5 6.5 0 0113 0" />
        <circle cx="17" cy="9" r="2.5" />
        <path d="M15 20a5 5 0 017-4.6" />
      </svg>
    );
  }
  if (name === "messages") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M21 12a8 8 0 01-8 8H7l-4 3V12a8 8 0 018-8h2a8 8 0 018 8z" />
        <path d="M8.5 10.5h7M8.5 14h4" />
      </svg>
    );
  }
  if (name === "invoices") {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M5 3h14v18H5z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 3h11l3 3v15H5z" />
      <path d="M8 8h7M8 12h7M8 16h5" />
    </svg>
  );
}
