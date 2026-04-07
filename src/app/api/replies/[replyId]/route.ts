import { ApiError, handleRouteError, jsonResponse } from "@/lib/api";
import { deleteReplyTree } from "@/lib/admin";
import { requireAdminUser } from "@/lib/auth";
import { NextRequest } from "next/server";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ replyId: string }> },
) {
    try {
        await requireAdminUser(request);
        const { replyId } = await params;

        const deleted = await deleteReplyTree(replyId);

        if (!deleted) {
            throw new ApiError(404, "Reply not found");
        }

        return jsonResponse(
            {
                success: true,
                deleted: {
                    type: "reply",
                    id: deleted.target.id,
                    label: deleted.target.body,
                    counts: deleted.counts,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        return handleRouteError(error);
    }
}
