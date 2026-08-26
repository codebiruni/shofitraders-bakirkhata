import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-base-200 px-4">
            <div className="w-full max-w-sm rounded-box border border-base-300 bg-base-100 p-8 shadow-sm">
                <div className="mb-8 text-center">
                    <p className="text-[11px] font-medium tracking-[0.22em] text-ink-soft">
                        SHOFI TRADERS
                    </p>
                    <h1 className="mt-1 text-xl font-semibold tracking-tight text-ink">
                        বাকির খাতা
                    </h1>
                </div>
                <LoginForm />
            </div>
        </main>
    );
}
