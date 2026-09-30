"use client";

import { useEffect, useState } from "react";
import { Download, X } from "@phosphor-icons/react";

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "android" | "ios" | "desktop" | "installed";

function detectPlatform(): Platform {
    if (typeof window === "undefined") return "desktop";

    const ua = window.navigator.userAgent;
    const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (standalone) return "installed";
    if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
    if (/Android/i.test(ua)) return "android";
    return "desktop";
}

export function InstallButton() {
    const [deferredPrompt, setDeferredPrompt] =
        useState<BeforeInstallPromptEvent | null>(null);
    const [platform, setPlatform] = useState<Platform>("desktop");
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        setPlatform(detectPlatform());

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
        };

        const installed = () => setPlatform("installed");

        window.addEventListener("beforeinstallprompt", handler);
        window.addEventListener("appinstalled", installed);

        return () => {
            window.removeEventListener("beforeinstallprompt", handler);
            window.removeEventListener("appinstalled", installed);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) {
            setShowHelp(true);
            return;
        }

        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") {
            setDeferredPrompt(null);
            setPlatform("installed");
        }
    };

    if (platform === "installed") return null;

    const helpText: Record<Exclude<Platform, "installed">, string> = {
        android: "Chrome মেনু (⋮) খুলে \"Install app\" বা \"Add to Home screen\" চাপুন।",
        ios: "Safari-তে Share বোতাম (⬆️) চেপে \"Add to Home Screen\" নির্বাচন করুন।",
        desktop: "ব্রাউজারের অ্যাড্রেস বারের ডানদিকে ইনস্টল আইকনে (⊕) ক্লিক করুন।",
    };

    return (
        <>
            <button
                onClick={handleInstall}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-content rounded-lg hover:bg-primary-focus transition-colors"
            >
                <Download size={20} />
                অ্যাপটি ইনস্টল করুন
            </button>

            {showHelp && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
                    onClick={() => setShowHelp(false)}
                >
                    <div
                        className="w-full max-w-md rounded-xl bg-base-100 p-5 shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="mb-3 flex items-center justify-between">
                            <h3 className="font-semibold text-ink">অ্যাপটি ইনস্টল করুন</h3>
                            <button
                                onClick={() => setShowHelp(false)}
                                aria-label="বন্ধ করুন"
                                className="text-ink-soft hover:text-ink"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <p className="text-sm text-ink-soft">{helpText[platform]}</p>
                    </div>
                </div>
            )}
        </>
    );
}
