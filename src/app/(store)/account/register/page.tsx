import RegisterForm from "@/components/store/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex flex-col justify-center py-12 px-6 lg:px-8 bg-gray-50/50 dark:bg-black/50">
      <RegisterForm />
    </div>
  );
}
