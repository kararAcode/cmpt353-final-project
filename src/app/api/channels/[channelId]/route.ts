import { ApiError, handleRouteError, jsonResponse } from "@/lib/api";
import { deleteChannelTree } from "@/lib/admin";
import { requireAdminUser } from "@/lib/auth";
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

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ channelId: string }> },
) {
    try {
        await requireAdminUser(request);
        const { channelId } = await params;

        const deleted = await deleteChannelTree(channelId);

        if (!deleted) {
            throw new ApiError(404, "Channel not found.");
        }

        return jsonResponse(
            {
                success: true,
                deleted: {
                    type: "channel",
                    id: deleted.target.id,
                    label: deleted.target.name,
                    counts: deleted.counts,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        return handleRouteError(error);
    }
}
