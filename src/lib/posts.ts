import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

type VoteSummary = {
    upvotes: number;
    downvotes: number;
    score: number;
};

type AttachmentSummary = {
    id: string;
    path: string;
    mimeType: string;
    sizeBytes: number;
};

type ReplyNode = {
    id: string;
    postId: string;
    parentReplyId: string | null;
    body: string;
    createdAt: Date;
    currentUserVote: number | null;
    author: {
        id: string;
        displayName: string;
    };
    attachments: AttachmentSummary[];
    voteSummary: VoteSummary;
    replies: ReplyNode[];
};

function emptyVoteSummary(): VoteSummary {
    return {
        upvotes: 0,
        downvotes: 0,
        score: 0,
    };
}

function buildVoteSummaryMap(
    votes: Array<{ targetId: string; value: number }>,
): Map<string, VoteSummary> {
    const voteMap = new Map<string, VoteSummary>();

    for (const vote of votes) {
        const current = voteMap.get(vote.targetId) ?? emptyVoteSummary();

        if (vote.value > 0) {
            current.upvotes += 1;
        } else if (vote.value < 0) {
            current.downvotes += 1;
        }

        current.score = current.upvotes - current.downvotes;
        voteMap.set(vote.targetId, current);
    }

    return voteMap;
}

function buildCurrentUserVoteMap(
    votes: Array<{ targetId: string; userId: string; value: number }>,
    currentUserId?: string,
): Map<string, number> {
    const voteMap = new Map<string, number>();

    if (!currentUserId) {
        return voteMap;
    }

    for (const vote of votes) {
        if (vote.userId === currentUserId) {
            voteMap.set(vote.targetId, vote.value);
        }
    }

    return voteMap;
}

function buildAttachmentMap(
    attachments: Array<
        AttachmentSummary & {
            targetId: string;
        }
    >,
): Map<string, AttachmentSummary[]> {
    const attachmentMap = new Map<string, AttachmentSummary[]>();

    for (const attachment of attachments) {
        const current = attachmentMap.get(attachment.targetId) ?? [];
        current.push({
            id: attachment.id,
            path: attachment.path,
            mimeType: attachment.mimeType,
            sizeBytes: attachment.sizeBytes,
        });
        attachmentMap.set(attachment.targetId, current);
    }

    return attachmentMap;
}

function buildReplyTree(replies: ReplyNode[]): ReplyNode[] {
    const replyMap = new Map<string, ReplyNode>();
    const roots: ReplyNode[] = [];

    for (const reply of replies) {
        replyMap.set(reply.id, { ...reply, replies: [] });
    }

    for (const reply of replies) {
        const current = replyMap.get(reply.id);

        if (!current) {
            continue;
        }

        if (!reply.parentReplyId) {
            roots.push(current);
            continue;
        }

        const parent = replyMap.get(reply.parentReplyId);

        if (!parent) {
            roots.push(current);
            continue;
        }

        parent.replies.push(current);
    }

    return roots;
}

export async function getPostDetail(postId: string, currentUserId?: string) {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        include: {
            author: {
                select: {
                    id: true,
                    displayName: true,
                },
            },
        },
    });

    if (!post) {
        throw new ApiError(404, "Post not found");
    }

    const replies = await prisma.reply.findMany({
        where: { postId },
        orderBy: [{ createdAt: "asc" }],
        include: {
            author: {
                select: {
                    id: true,
                    displayName: true,
                },
            },
        },
    });

    const replyIds = replies.map((reply) => reply.id);

    const [attachments, votes] = await Promise.all([
        prisma.attachment.findMany({
            where: {
                OR: [
                    {
                        targetType: "post",
                        targetId: postId,
                    },
                    {
                        targetType: "reply",
                        targetId: {
                            in: replyIds,
                        },
                    },
                ],
            },
            select: {
                id: true,
                targetId: true,
                path: true,
                mimeType: true,
                sizeBytes: true,
            },
        }),
        prisma.vote.findMany({
            where: {
                OR: [
                    {
                        targetType: "post",
                        targetId: postId,
                    },
                    {
                        targetType: "reply",
                        targetId: {
                            in: replyIds,
                        },
                    },
                ],
            },
            select: {
                targetId: true,
                userId: true,
                value: true,
            },
        }),
    ]);

    const attachmentMap = buildAttachmentMap(attachments);
    const voteMap = buildVoteSummaryMap(votes);
    const currentUserVoteMap = buildCurrentUserVoteMap(votes, currentUserId);
    const replyTree = buildReplyTree(
        replies.map((reply) => ({
            id: reply.id,
            postId: reply.postId,
            parentReplyId: reply.parentReplyId,
            body: reply.body,
            createdAt: reply.createdAt,
            currentUserVote: currentUserVoteMap.get(reply.id) ?? null,
            author: reply.author,
            attachments: attachmentMap.get(reply.id) ?? [],
            voteSummary: voteMap.get(reply.id) ?? emptyVoteSummary(),
            replies: [],
        })),
    );

    return {
        post: {
            id: post.id,
            channelId: post.channelId,
            title: post.title,
            body: post.body,
            createdAt: post.createdAt,
            currentUserVote: currentUserVoteMap.get(post.id) ?? null,
            author: post.author,
            attachments: attachmentMap.get(post.id) ?? [],
            voteSummary: voteMap.get(post.id) ?? emptyVoteSummary(),
            topLevelReplyCount: replyTree.length,
        },
        replies: replyTree,
    };
}
