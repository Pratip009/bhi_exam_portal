import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AppShell from "./AppShell";

export default async function RoleLayout({ role, children }) {
  const session = await getSession();
  if (!session || session.role !== role) redirect("/login");
  return <AppShell session={{ name: session.name, role: session.role }}>{children}</AppShell>;
}
