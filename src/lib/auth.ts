import NextAuth, { CredentialsSignin } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: "/signin",
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) throw new InvalidCredentialsError();

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) throw new InvalidCredentialsError();

        const valid = await verifyPassword(password, user.password);
        if (!valid) throw new InvalidCredentialsError();

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // OAuth (Google) -> upsert the local AYLI user by email.
    // Credentials accounts already exist in Postgres, so skip.
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name ?? undefined,
            image: user.image ?? undefined,
          },
          create: {
            email: user.email,
            name: user.name,
            image: user.image,
            role: "CUSTOMER",
          },
        });
      }
      return true;
    },
    // Stamp our own user id/role onto the JWT. Only queries the DB at sign-in
    // (or on session update); returning requests reuse the existing token.
    async jwt({ token, user, trigger }) {
      if (user?.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: user.email } });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.email = dbUser.email;
          token.name = dbUser.name;
          token.picture = dbUser.image;
        }
      }
      if (trigger === "update" && typeof token.email === "string") {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email } });
        if (dbUser) {
          token.name = dbUser.name;
          token.picture = dbUser.image;
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id;
        session.user.role = token.role ?? "CUSTOMER";
        session.user.name = token.name ?? session.user.name ?? null;
        session.user.email = token.email ?? session.user.email ?? null;
        session.user.image = token.picture ?? session.user.image ?? null;
      }
      return session;
    },
  },
});