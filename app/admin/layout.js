import RoleLayout from "@/components/RoleLayout";
export default function Layout({ children }) {
  return <RoleLayout role="admin">{children}</RoleLayout>;
}
