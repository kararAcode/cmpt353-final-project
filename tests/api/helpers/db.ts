import path from "path";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { mkdir, rm } from "fs/promises";

import { TEST_ATTACHMENT_DIR, TEST_DATABASE_URL, TEST_USERS } from "./env";

const adapter = new PrismaPg({
    connectionString: TEST_DATABASE_URL,
});

export const prisma = new PrismaClient({
    adapter,
});

export type SeededState = {
    users: {
        admin: { id: string };
        member: { id: string };
        guest: { id: string };
    };
    channels: {
        general: { id: string };
        random: { id: string };
    };
    posts: {
        testing: { id: string };
        prisma: { id: string };
        random: { id: string };
    };
    replies: {
        topLevel: { id: string };
        nested: { id: string };
        prisma: { id: string };
    };
};

async function resetAttachmentDirectory() {
    await rm(path.resolve(TEST_ATTACHMENT_DIR), { recursive: true, force: true });
    await mkdir(path.resolve(TEST_ATTACHMENT_DIR), { recursive: true });
}

export async function resetDatabase() {
    await prisma.$transaction([
        prisma.vote.deleteMany(),
        prisma.attachment.deleteMany(),
        prisma.reply.deleteMany(),
        prisma.post.deleteMany(),
        prisma.channel.deleteMany(),
        prisma.user.deleteMany(),
    ]);

    await resetAttachmentDirectory();
}

export async function seedDatabase(): Promise<SeededState> {
    const [adminPasswordHash, memberPasswordHash, guestPasswordHash] = await Promise.all([
        bcrypt.hash(TEST_USERS.admin.password, 10),
        bcrypt.hash(TEST_USERS.member.password, 10),
        bcrypt.hash(TEST_USERS.guest.password, 10),
    ]);

    const admin = await prisma.user.create({
        data: {
            email: TEST_USERS.admin.email,
            displayName: TEST_USERS.admin.displayName,
            passwordHash: adminPasswordHash,
            role: TEST_USERS.admin.role,
            createdAt: new Date("2026-01-01T10:00:00.000Z"),
        },
    });

    const member = await prisma.user.create({
        data: {
            email: TEST_USERS.member.email,
            displayName: TEST_USERS.member.displayName,
            passwordHash: memberPasswordHash,
            role: TEST_USERS.member.role,
            createdAt: new Date("2026-01-02T10:00:00.000Z"),
        },
    });

    const guest = await prisma.user.create({
        data: {
            email: TEST_USERS.guest.email,
            displayName: TEST_USERS.guest.displayName,
            passwordHash: guestPasswordHash,
            role: TEST_USERS.guest.role,
            createdAt: new Date("2026-01-03T10:00:00.000Z"),
        },
    });

    const general = await prisma.channel.create({
        data: {
            name: "general",
            description: "General team chat",
            createdById: admin.id,
            createdAt: new Date("2026-02-01T10:00:00.000Z"),
        },
    });

    const random = await prisma.channel.create({
        data: {
            name: "random",
            description: "Off-topic space",
            createdById: member.id,
            createdAt: new Date("2026-02-02T10:00:00.000Z"),
        },
    });

    const testingPost = await prisma.post.create({
        data: {
            channelId: general.id,
            authorId: member.id,
            title: "Playwright API coverage",
            body: "We should test every endpoint and its status handling.",
            createdAt: new Date("2026-03-01T10:00:00.000Z"),
        },
    });

    const prismaPost = await prisma.post.create({
        data: {
            channelId: general.id,
            authorId: guest.id,
            title: "Prisma search tips",
            body: "Indexes help keep search fast for Playwright demos too.",
            createdAt: new Date("2026-03-02T10:00:00.000Z"),
        },
    });

    const randomPost = await prisma.post.create({
        data: {
            channelId: random.id,
            authorId: member.id,
            title: "Random note",
            body: "This channel exists to test filtering by channel.",
            createdAt: new Date("2026-03-03T10:00:00.000Z"),
        },
    });

    const topLevelReply = await prisma.reply.create({
        data: {
            postId: testingPost.id,
            parentReplyId: null,
            authorId: guest.id,
            body: "First reply about Playwright coverage.",
            createdAt: new Date("2026-03-04T10:00:00.000Z"),
        },
    });

    const nestedReply = await prisma.reply.create({
        data: {
            postId: testingPost.id,
            parentReplyId: topLevelReply.id,
            authorId: member.id,
            body: "Nested reply to exercise reply trees.",
            createdAt: new Date("2026-03-05T10:00:00.000Z"),
        },
    });

    const prismaReply = await prisma.reply.create({
        data: {
            postId: prismaPost.id,
            parentReplyId: null,
            authorId: admin.id,
            body: "Search summary should still work with multiple authors.",
            createdAt: new Date("2026-03-06T10:00:00.000Z"),
        },
    });

    await prisma.vote.createMany({
        data: [
            {
                userId: member.id,
                targetType: "post",
                targetId: testingPost.id,
                value: 1,
            },
            {
                userId: guest.id,
                targetType: "post",
                targetId: testingPost.id,
                value: -1,
            },
            {
                userId: admin.id,
                targetType: "reply",
                targetId: topLevelReply.id,
                value: 1,
            },
        ],
    });

    await prisma.attachment.createMany({
        data: [
            {
                targetType: "post",
                targetId: testingPost.id,
                mimeType: "image/png",
                sizeBytes: 16,
                path: "/test-attachments/existing-post.png",
            },
            {
                targetType: "reply",
                targetId: topLevelReply.id,
                mimeType: "image/png",
                sizeBytes: 16,
                path: "/test-attachments/existing-reply.png",
            },
        ],
    });

    return {
        users: {
            admin: { id: admin.id },
            member: { id: member.id },
            guest: { id: guest.id },
        },
        channels: {
            general: { id: general.id },
            random: { id: random.id },
        },
        posts: {
            testing: { id: testingPost.id },
            prisma: { id: prismaPost.id },
            random: { id: randomPost.id },
        },
        replies: {
            topLevel: { id: topLevelReply.id },
            nested: { id: nestedReply.id },
            prisma: { id: prismaReply.id },
        },
    };
}
