import { prisma } from "@/lib/prisma";

type DeleteCounts = {
    channels: number;
    posts: number;
    replies: number;
    votes: number;
    attachments: number;
    users: number;
};

function emptyDeleteCounts(): DeleteCounts {
    return {
        channels: 0,
        posts: 0,
        replies: 0,
        votes: 0,
        attachments: 0,
        users: 0,
    };
}

function mergeDeleteCounts(...counts: DeleteCounts[]): DeleteCounts {
    return counts.reduce<DeleteCounts>(
        (accumulator, current) => ({
            channels: accumulator.channels + current.channels,
            posts: accumulator.posts + current.posts,
            replies: accumulator.replies + current.replies,
            votes: accumulator.votes + current.votes,
            attachments: accumulator.attachments + current.attachments,
            users: accumulator.users + current.users,
        }),
        emptyDeleteCounts(),
    );
}

function collectReplyDescendantIds(
    replies: Array<{ id: string; parentReplyId: string | null }>,
    rootReplyId: string,
): string[] {
    const childMap = new Map<string, string[]>();

    for (const reply of replies) {
        if (!reply.parentReplyId) {
            continue;
        }

        const current = childMap.get(reply.parentReplyId) ?? [];
        current.push(reply.id);
        childMap.set(reply.parentReplyId, current);
    }

    const ids = new Set<string>();
    const stack = [rootReplyId];

    while (stack.length > 0) {
        const currentId = stack.pop();

        if (!currentId || ids.has(currentId)) {
            continue;
        }

        ids.add(currentId);

        for (const childId of childMap.get(currentId) ?? []) {
            stack.push(childId);
        }
    }

    return Array.from(ids);
}

async function deleteVotesAndAttachmentsForTargets(
    postIds: string[],
    replyIds: string[],
) {
    const [deletedPostVotes, deletedReplyVotes, deletedPostAttachments, deletedReplyAttachments] =
        await prisma.$transaction([
            prisma.vote.deleteMany({
                where: {
                    targetType: "post",
                    targetId: {
                        in: postIds.length > 0 ? postIds : ["__none__"],
                    },
                },
            }),
            prisma.vote.deleteMany({
                where: {
                    targetType: "reply",
                    targetId: {
                        in: replyIds.length > 0 ? replyIds : ["__none__"],
                    },
                },
            }),
            prisma.attachment.deleteMany({
                where: {
                    targetType: "post",
                    targetId: {
                        in: postIds.length > 0 ? postIds : ["__none__"],
                    },
                },
            }),
            prisma.attachment.deleteMany({
                where: {
                    targetType: "reply",
                    targetId: {
                        in: replyIds.length > 0 ? replyIds : ["__none__"],
                    },
                },
            }),
        ]);

    return {
        votes: deletedPostVotes.count + deletedReplyVotes.count,
        attachments: deletedPostAttachments.count + deletedReplyAttachments.count,
    };
}

export async function deleteReplyTree(replyId: string) {
    const reply = await prisma.reply.findUnique({
        where: { id: replyId },
        select: {
            id: true,
            postId: true,
            body: true,
        },
    });

    if (!reply) {
        return null;
    }

    const postReplies = await prisma.reply.findMany({
        where: {
            postId: reply.postId,
        },
        select: {
            id: true,
            parentReplyId: true,
        },
    });

    const replyIds = collectReplyDescendantIds(postReplies, reply.id);
    const cleanup = await deleteVotesAndAttachmentsForTargets([], replyIds);
    const deletedReplies = await prisma.reply.deleteMany({
        where: {
            id: {
                in: replyIds,
            },
        },
    });

    return {
        target: reply,
        counts: {
            ...emptyDeleteCounts(),
            replies: deletedReplies.count,
            votes: cleanup.votes,
            attachments: cleanup.attachments,
        },
    };
}

export async function deletePostTree(postId: string) {
    const post = await prisma.post.findUnique({
        where: { id: postId },
        select: {
            id: true,
            title: true,
        },
    });

    if (!post) {
        return null;
    }

    const replies = await prisma.reply.findMany({
        where: {
            postId,
        },
        select: {
            id: true,
        },
    });

    const replyIds = replies.map((reply) => reply.id);
    const cleanup = await deleteVotesAndAttachmentsForTargets([postId], replyIds);
    const [deletedReplies, deletedPosts] = await prisma.$transaction([
        prisma.reply.deleteMany({
            where: {
                postId,
            },
        }),
        prisma.post.deleteMany({
            where: {
                id: postId,
            },
        }),
    ]);

    return {
        target: post,
        counts: {
            ...emptyDeleteCounts(),
            posts: deletedPosts.count,
            replies: deletedReplies.count,
            votes: cleanup.votes,
            attachments: cleanup.attachments,
        },
    };
}

export async function deleteChannelTree(channelId: string) {
    const channel = await prisma.channel.findUnique({
        where: { id: channelId },
        select: {
            id: true,
            name: true,
        },
    });

    if (!channel) {
        return null;
    }

    const posts = await prisma.post.findMany({
        where: {
            channelId,
        },
        select: {
            id: true,
        },
    });
    const postIds = posts.map((post) => post.id);

    const replies = postIds.length > 0
        ? await prisma.reply.findMany({
              where: {
                  postId: {
                      in: postIds,
                  },
              },
              select: {
                  id: true,
              },
          })
        : [];
    const replyIds = replies.map((reply) => reply.id);

    const cleanup = await deleteVotesAndAttachmentsForTargets(postIds, replyIds);
    const [deletedReplies, deletedPosts, deletedChannels] = await prisma.$transaction([
        prisma.reply.deleteMany({
            where: {
                postId: {
                    in: postIds.length > 0 ? postIds : ["__none__"],
                },
            },
        }),
        prisma.post.deleteMany({
            where: {
                channelId,
            },
        }),
        prisma.channel.deleteMany({
            where: {
                id: channelId,
            },
        }),
    ]);

    return {
        target: channel,
        counts: {
            ...emptyDeleteCounts(),
            channels: deletedChannels.count,
            posts: deletedPosts.count,
            replies: deletedReplies.count,
            votes: cleanup.votes,
            attachments: cleanup.attachments,
        },
    };
}

export async function deleteUserTree(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            displayName: true,
            role: true,
        },
    });

    if (!user) {
        return null;
    }

    const channels = await prisma.channel.findMany({
        where: {
            createdById: userId,
        },
        select: {
            id: true,
        },
    });
    const channelIds = channels.map((channel) => channel.id);

    const posts = await prisma.post.findMany({
        where: {
            OR: [
                {
                    authorId: userId,
                },
                {
                    channelId: {
                        in: channelIds.length > 0 ? channelIds : ["__none__"],
                    },
                },
            ],
        },
        select: {
            id: true,
        },
    });
    const postIds = Array.from(new Set(posts.map((post) => post.id)));

    const replies = await prisma.reply.findMany({
        where: {
            OR: [
                {
                    authorId: userId,
                },
                {
                    postId: {
                        in: postIds.length > 0 ? postIds : ["__none__"],
                    },
                },
            ],
        },
        select: {
            id: true,
        },
    });
    const replyIds = Array.from(new Set(replies.map((reply) => reply.id)));

    const cleanup = await deleteVotesAndAttachmentsForTargets(postIds, replyIds);
    const [deletedReplies, deletedPosts, deletedChannels, deletedOwnVotes, deletedUser] = await prisma.$transaction([
        prisma.reply.deleteMany({
            where: {
                id: {
                    in: replyIds.length > 0 ? replyIds : ["__none__"],
                },
            },
        }),
        prisma.post.deleteMany({
            where: {
                id: {
                    in: postIds.length > 0 ? postIds : ["__none__"],
                },
            },
        }),
        prisma.channel.deleteMany({
            where: {
                id: {
                    in: channelIds.length > 0 ? channelIds : ["__none__"],
                },
            },
        }),
        prisma.vote.deleteMany({
            where: {
                userId,
            },
        }),
        prisma.user.deleteMany({
            where: {
                id: userId,
            },
        }),
    ]);

    return {
        target: user,
        counts: mergeDeleteCounts(
            {
                ...emptyDeleteCounts(),
                channels: deletedChannels.count,
                posts: deletedPosts.count,
                replies: deletedReplies.count,
                users: deletedUser.count,
            },
            {
                ...emptyDeleteCounts(),
                votes: cleanup.votes,
                attachments: cleanup.attachments,
            },
            {
                ...emptyDeleteCounts(),
                votes: deletedOwnVotes.count,
            },
        ),
    };
}
