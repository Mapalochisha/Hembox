import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { 
    signIn: "/account/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email" },
        password: { label: "Password", type: "password" },
        userType: { label: "User Type", type: "hidden" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Try Admin first if explicitly requested or check both
        const admin = await db.adminUser.findUnique({
          where: { email: credentials.email },
        });

        if (admin && admin.passwordHash) {
          const valid = await bcrypt.compare(credentials.password, admin.passwordHash);
          if (valid) {
            return { id: admin.id, email: admin.email, name: admin.name, role: admin.role };
          }
        }

        // Try Customer
        const customer = await db.customer.findUnique({
          where: { email: credentials.email },
        });

        if (customer && customer.passwordHash) {
          const valid = await bcrypt.compare(credentials.password, customer.passwordHash);
          if (valid) {
            return { id: customer.id, email: customer.email, name: customer.name, role: "CUSTOMER" };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
      }
      return session;
    },
  },
};
