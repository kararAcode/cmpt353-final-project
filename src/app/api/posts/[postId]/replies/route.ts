import { ApiError, handleRouteError } from "@/lib/api";
import { createAttachments } from "@/lib/attachments";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ postId: string }> },
) {
    try {
        const user = await requireAuthenticatedUser(request);

        const { postId } = await params;

        const post = await prisma.post.findUnique({
            where: {
                id: postId,
            },
        });

        if (!post) {
            throw new ApiError(404, "Post not found");
        }

        const formData = await request.formData();
        const body = formData.get("body");
        const attachments = formData.getAll("attachments");

        if (!body) {
            throw new ApiError(400, "Missing fields: body");
        }

        const newReply = await prisma.reply.create({
            data: {
                postId,
                parentReplyId: null,
                authorId: user.id,
                body: body.toString(),
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
            targetId: newReply.id,
            targetType: "reply",
        });

        return NextResponse.json(
            { data: { reply: newReply, attachments: attachmentRecords } },
            { status: 201 },
        );
    } catch (error) {
        return handleRouteError(error);
    }
}
