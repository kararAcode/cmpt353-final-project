import { handleRouteError, jsonResponse } from "@/lib/api";
import { requireAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    try {
        await requireAdminUser(request);

        const users = await prisma.user.findMany({
            orderBy: [
                {
                    createdAt: "desc",
                },
            ],
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                createdAt: true,
                _count: {
                    select: {
                        channels: true,
                        posts: true,
                        replies: true,
                    },
                },
            },
        });

        return jsonResponse(
            users.map((user) => ({
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                createdAt: user.createdAt,
                counts: {
                    channels: user._count.channels,
                    posts: user._count.posts,
                    replies: user._count.replies,
                },
            })),
            { status: 200 },
        );
    } catch (error) {
        return handleRouteError(error);
    }
}
