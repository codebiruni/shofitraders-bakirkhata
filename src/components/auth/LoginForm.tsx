"use client";

import { useState, FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function LoginForm() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError("");
        setLoading(true);

        const res = await signIn("credentials", {
            username,
            password,
            redirect: false,
        });

        setLoading(false);

        if (res?.error) {
            setError("ভুল ইউজারনেম বা পাসওয়ার্ড");
            return;
        }

        router.push("/");
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
                <label className="label" htmlFor="username">
                    <span className="label-text">ইউজারনেম</span>
                </label>
                <input
                    id="username"
                    type="text"
                    className="input input-bordered w-full"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    required
                />
            </div>

            <div className="form-control">
                <label className="label" htmlFor="password">
                    <span className="label-text">পাসওয়ার্ড</span>
                </label>
                <input
                    id="password"
                    type="password"
                    className="input input-bordered w-full"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                />
            </div>

            {error && (
                <p className="text-sm text-error" role="alert">
                    {error}
                </p>
            )}

            <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={loading}
            >
                {loading ? <span className="loading loading-spinner loading-sm" /> : "লগইন করুন"}
            </button>
        </form>
    );
}
