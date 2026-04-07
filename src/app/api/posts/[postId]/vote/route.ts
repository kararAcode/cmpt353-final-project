import { ApiError, handleRouteError, readJsonBody } from "@/lib/api";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> },
) {
    try {
        const user = await requireAuthenticatedUser(request);
        const { value } = await readJsonBody(request);

        const { postId } = await params;

        if (value == null || value == undefined) {
            throw new ApiError(400, "Value must be passed and a number");
        }

        const post = await prisma.post.findFirst({
            where: { id: postId },
        });

        if (!post) {
            throw new ApiError(404, "Post not found");
        }

        if (value == 0) {
            await prisma.vote.deleteMany({
                where: {
                    userId: user.id,
                    targetId: postId,
                    targetType: "post",
                }
            });
        } else {
            await prisma.vote.upsert({
                where: {
                    userId_targetId: {
                        userId: user.id,
                        targetId: postId,
                    },
                },
            
                update: { value },
                create: {
                    userId: user.id,
                    targetId: post.id,
                    targetType: "post",
                    value: value as number,
                },
                
            });
        }

        const votes = await prisma.vote.findMany({
            where: {
                targetId: postId,
                targetType: "post",
            },
            select: {
                userId: true,
                value: true,
            },
        });

        const voteSummary = {
            upvotes: 0,
            downvotes: 0,
            score: 0,
        };

        let currentUserVote = null;

        for (const vote of votes) {
            if (vote.value > 0) {
                voteSummary.upvotes += 1;
            } else if (vote.value < 0) {
                voteSummary.downvotes += 1;
            }

            voteSummary.score = voteSummary.upvotes - voteSummary.downvotes;

            if (vote.userId === user.id) {
                currentUserVote = vote.value;
            }
        }

        return NextResponse.json(
            {
                data: {
                    targetId: postId,
                    targetType: "post",
                    currentUserVote,
                    voteSummary,
                },
            },
            { status: 200 },
        );
    } catch (error) {
        return handleRouteError(error);
    }
}
