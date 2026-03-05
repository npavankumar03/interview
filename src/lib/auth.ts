import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { query, getOne } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "placeholder",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "placeholder",
    }),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await getOne("SELECT * FROM users WHERE email = $1", [credentials.email]);

        if (user) {
          if (!user.password_hash) return null;
          const valid = await bcrypt.compare(credentials.password, user.password_hash);
          if (!valid) return null;
          return { id: user.id, email: user.email, name: user.name, image: user.image };
        }

        // New user — create account
        const hash = await bcrypt.hash(credentials.password, 10);
        const newUser = await getOne(
          `INSERT INTO users (email, name, password_hash, credits)
           VALUES ($1, $2, $3, (SELECT COALESCE(CAST(value AS INTEGER), 3) FROM app_settings WHERE key = 'free_credits'))
           RETURNING id, email, name`,
          [credentials.email, credentials.email.split("@")[0], hash]
        );

        if (!newUser) return null;
        return { id: newUser.id, email: newUser.email, name: newUser.name };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await query(
          `INSERT INTO users (email, name, image, credits)
           VALUES ($1, $2, $3, (SELECT COALESCE(CAST(value AS INTEGER), 3) FROM app_settings WHERE key = 'free_credits'))
           ON CONFLICT (email) DO UPDATE SET name = $2, image = $3`,
          [user.email, user.name, user.image]
        );
      }
      return true;
    },
    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await getOne(
          "SELECT id, role, plan, credits FROM users WHERE email = $1",
          [session.user.email]
        );
        if (dbUser) {
          (session as any).userId = dbUser.id;
          (session as any).role = dbUser.role;
          (session as any).plan = dbUser.plan;
          (session as any).credits = dbUser.credits;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
