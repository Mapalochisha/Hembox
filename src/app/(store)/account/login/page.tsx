import LoginForm from "@/components/store/LoginForm";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 px-6 lg:px-8 bg-gray-50/50 dark:bg-black/50">
      <Suspense fallback={
        <div className="w-full max-w-md mx-auto p-6 bg-white dark:bg-[#0f0f0f] border border-black/5 dark:border-white/5 shadow-sm animate-pulse h-[400px]" />
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
