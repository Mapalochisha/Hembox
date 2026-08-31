import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AdminLayoutClient from "./AdminLayoutClient";
import { isAdminRole } from "@/lib/roles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || !isAdminRole((session.user as any).role)) {
    return <>{children}</>;
  }

  return (
    <AdminLayoutClient session={session}>
      {children}
    </AdminLayoutClient>
  );
}
