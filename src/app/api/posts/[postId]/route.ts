import { ApiError, handleRouteError, jsonResponse } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { getPostDetail } from "@/lib/posts";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> },
) {
    try {
        const { postId } = await params;
        const currentUser = await getCurrentUser();

        const post = await prisma.post.findFirst({
            where: {
                id: postId,
            },
        });

        if (!post) {
            throw new ApiError(404, "Post with given id not found");
        }
        const result = await getPostDetail(postId, currentUser?.id);

        return jsonResponse(result);
    } catch (error) {
        return handleRouteError(error);
    }
}
