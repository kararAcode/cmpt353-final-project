import { ApiError, handleRouteError, jsonResponse } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ channelId: string }> },
) {
    try {
        const { channelId } = await params;

        const channel = await prisma.channel.findUnique({
            where: {
                id: channelId,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
                _count: {
                    select: {
                        posts: true,
                    },
                },
            },
        });

        if (!channel) {
            throw new ApiError(404, "Channel not found.");
        }

        return jsonResponse(
            {
                id: channel.id,
                name: channel.name,
                description: channel.description,
                createdAt: channel.createdAt,
                createdBy: channel.createdBy,
                postCount: channel._count.posts,
            },
            { status: 200 },
        );
    } catch (error) {
        return handleRouteError(error);
    }
}
