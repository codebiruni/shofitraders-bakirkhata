import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                username: { label: "Username", type: "text" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                const username = process.env.AUTH_USERNAME;
                const passwordHash = process.env.AUTH_PASSWORD_HASH;

                if (!username || !passwordHash || !credentials?.password) {
                    return null;
                }

                const passwordOk = await bcrypt.compare(
                    credentials.password,
                    passwordHash
                );

                if (credentials.username === username && passwordOk) {
                    return { id: "1", name: username };
                }
                return null;
            },
        }),
    ],
    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
    pages: { signIn: "/login" },
    secret: process.env.NEXTAUTH_SECRET,
};
