"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, User } from "lucide-react";

export default function RegisterForm() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
      } else {
        router.push("/account/login?registered=true");
      }
    } catch (err) {
      setError("Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-[#0f0f0f] border border-black/5 dark:border-white/5 shadow-sm">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-black uppercase tracking-tighter italic">Join Hembox</h2>
        <p className="text-xs opacity-50 uppercase tracking-widest mt-2">Create your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-200 dark:border-red-900/30 uppercase tracking-wider text-center">
            {error}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Full Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 opacity-20" size={16} />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border-none text-sm focus:ring-1 focus:ring-black dark:focus:ring-white transition-all outline-none"
              placeholder="John Doe"
            />
          </div>
        </div>

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
          <label className="text-[10px] font-bold uppercase tracking-widest opacity-40 ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 opacity-20" size={16} />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border-none text-sm focus:ring-1 focus:ring-black dark:focus:ring-white transition-all outline-none"
              placeholder="••••••••"
            />
          </div>
          <p className="text-[9px] opacity-30 mt-1 uppercase tracking-tighter">Minimum 6 characters</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-[#111] dark:bg-white text-white dark:text-black text-xs font-black uppercase tracking-[0.2em] hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="animate-spin" size={16} /> : "Create Account"}
        </button>
      </form>

      <div className="mt-8 text-center pt-6 border-t border-black/5 dark:border-white/5">
        <p className="text-[10px] uppercase tracking-widest opacity-40">
          Already have an account?{" "}
          <Link href="/account/login" className="font-bold opacity-100 text-black dark:text-white hover:underline underline-offset-4">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
