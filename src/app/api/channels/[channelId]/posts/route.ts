import { ApiError, handleRouteError } from "@/lib/api";
import { createAttachments } from "@/lib/attachments";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Attachment } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ channelId: string }> },
) {
    try {
        const { channelId } = await params;
        const posts = await prisma.post.findMany({
            where: {
                channelId,
            },

            include: {
                author: {
                    select: {
                        id: true,
                        displayName: true,
                    },
                },
            },
        });

        const postIds = posts.map((post) => post.id);

        const attachments = await prisma.attachment.findMany({
            where: {
                targetType: "post",
                targetId: {
                    in: postIds,
                },
            },
        });

        const attachmentMap = new Map<string, Attachment[]>();
        for (const attachment of attachments) {
            const current = attachmentMap.get(attachment.targetId) ?? [];
            current.push(attachment);
            attachmentMap.set(attachment.targetId, current);
        }

        const replyCounts = await prisma.reply.groupBy({
            by: ["postId"],
            where: {
                postId: { in: postIds },
                parentReplyId: null,
            },

            _count: {
                postId: true,
            },
        });

        const replyCountMap = new Map(
            replyCounts.map((row) => [row.postId, row._count.postId]),
        );

        const votes = await prisma.vote.findMany({
            where: {
                targetType: "post",
                targetId: {
                    in: postIds,
                },
            },
            select: {
                targetId: true,
                value: true,
            },
        });

        const voteMap = new Map<
            string,
            { upvotes: number; downvotes: number; score: number }
        >();

        for (const vote of votes) {
            const current = voteMap.get(vote.targetId) ?? {
                upvotes: 0,
                downvotes: 0,
                score: 0,
            };

            if (vote.value > 0) {
                current.upvotes += 1;
            } else if (vote.value < 0) {
                current.downvotes += 1;
            }

            current.score += vote.value;

            voteMap.set(vote.targetId, current);
        }

        const result = posts.map((post) => {
            return {
                ...post,
                attachments: attachmentMap.get(post.id) ?? [],
                topLevelReplyCount: replyCountMap.get(post.id) ?? 0,
                voteSummary: voteMap.get(post.id) ?? {
                    upvotes: 0,
                    downvotes: 0,
                    score: 0,
                },
            };
        });

        return NextResponse.json({ data: result }, { status: 200 });
    } catch (error) {
        return handleRouteError(error);
    }
}

// TODO: Make more robust and atomic
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ channelId: string }> },
) {
    try {
        const user = await requireAuthenticatedUser(request);
        const formData = await request.formData();
        const { channelId } = await params;

        const title = formData.get("title");
        const body = formData.get("body");
        const attachments = formData.getAll("attachments");

        if (!title || !body) {
            throw new ApiError(400, "Missing fields: title or body");
        }

        const channel = await prisma.channel.findUnique({
            where: {
                id: channelId,
            },
        });

        if (!channel) {
            throw new ApiError(404, "Channel not found");
        }

        const newPost = await prisma.post.create({
            data: {
                title: title.toString(),
                body: body.toString(),
                channelId,
                authorId: user.id,
            },
        });

        const files: File[] = [];
        for (const attachment of attachments) {
            if (!(attachment instanceof File)) {
                throw new ApiError(400, "Attachments must be files");
            }
            files.push(attachment);
        }

        const attachmentRecords = await createAttachments({
            files,
            targetType: "post",
            targetId: newPost.id,
        });

        return NextResponse.json(
            {
                data: { post: newPost, attachments: attachmentRecords },
            },
            { status: 201 },
        );
    } catch (error) {
        return handleRouteError(error);
    }
}
