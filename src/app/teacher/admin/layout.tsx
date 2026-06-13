import { type ReactNode } from "react";
import AdminLayoutClient from "./AdminLayoutClient";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
    return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
