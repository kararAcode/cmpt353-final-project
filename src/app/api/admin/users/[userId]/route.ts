import { ApiError, handleRouteError, jsonResponse } from "@/lib/api";
import { deleteUserTree } from "@/lib/admin";
import { requireAdminUser } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ userId: string }> },
) {
    try {
        const adminUser = await requireAdminUser(request);
        const { userId } = await params;

        if (adminUser.id === userId) {
            throw new ApiError(400, "Admins cannot delete their own account.");
        }

        const deleted = await deleteUserTree(userId);

        if (!deleted) {
            throw new ApiError(404, "User not found.");
        }

        return jsonResponse(
            {
                success: true,
                deleted: {
                    type: "user",
                    id: deleted.target.id,
                    label: deleted.target.displayName,
                    email: deleted.target.email,
                    counts: deleted.counts,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        return handleRouteError(error);
    }
}
