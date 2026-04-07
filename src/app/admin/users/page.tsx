import { redirect } from "next/navigation";

import { AdminUsersPage } from "@/components/admin/admin-users-page";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminUsersRoute() {
    const user = await getCurrentUser();

    if (!user) {
        redirect("/signin");
    }

    if (user.role !== "admin") {
        redirect("/channels");
    }

    return <AdminUsersPage />;
}
