"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function CreateAccountForm({ email, orderId }: { email: string; orderId: string }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/create-account-from-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, orderId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create account");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
        <p className="text-green-800 text-sm font-medium">Account created successfully! You can now sign in.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-100 rounded-xl p-6 text-left shadow-sm">
      <h3 className="text-sm font-black uppercase tracking-widest mb-2">Create an account</h3>
      <p className="text-xs text-gray-500 mb-4">Set a password to save your details for your next order.</p>
      
      <div className="space-y-4">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Choose a password"
          required
          minLength={6}
          className="w-full px-4 py-3 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-black outline-none"
        />
        
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 bg-black text-white text-xs font-medium py-3 rounded-lg hover:opacity-90 transition-opacity"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          {loading ? "Creating..." : "Create Account"}
        </button>
      </div>

      {error && <p className="text-red-600 text-xs mt-3">{error}</p>}
    </form>
  );
}
