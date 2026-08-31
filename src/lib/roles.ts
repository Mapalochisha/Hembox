export const ADMIN_ROLES = ["SUPER_ADMIN", "MANAGER", "STAFF"] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export function isAdminRole(role: unknown): role is AdminRole {
  return typeof role === "string" && ADMIN_ROLES.includes(role as AdminRole);
}
