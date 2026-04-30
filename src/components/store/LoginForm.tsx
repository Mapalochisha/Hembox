"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        email,
        password,
        userType: "CUSTOMER",
        redirect: false,
      });

      if (res?.error) {
        setError("Invalid email or password");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-[#0f0f0f] border border-black/5 dark:border-white/5 shadow-sm">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Welcome Back</h2>
        <p className="text-xs opacity-50 uppercase tracking-widest mt-2">Log in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-200 dark:border-red-900/30 uppercase tracking-wider text-center">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 opacity-20" size={16} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border-none text-sm focus:ring-1 focus:ring-black dark:focus:ring-white transition-all outline-none"
              placeholder="name@example.com"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-end ml-1">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-40">Password</label>
            <Link href="#" className="text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity">Forgot?</Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-20" size={16} />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border-none text-sm focus:ring-1 focus:ring-black dark:focus:ring-white transition-all outline-none"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#111] dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-[0.2em] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : "Sign In"}
        </button>
      </form>

      <div className="mt-8 text-center pt-6 border-t border-black/5 dark:border-white/5 space-y-4">
        <p className="text-[10px] uppercase tracking-widest opacity-40">
          Don&apos;t have an account?{" "}
          <Link href="/account/register" className="font-bold opacity-100 text-black dark:text-white hover:underline underline-offset-4">
            Register Now
          </Link>
        </p>
        <div className="pt-2">
          <Link href="/admin/login" className="text-[9px] uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 font-bold">
            <Lock size={10} />
            Staff Login
          </Link>
        </div>
      </div>
    </div>
  );
}
