import "dotenv/config";

import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const adminName = process.env.SEED_ADMIN_NAME || "Admin User";
const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
const adminPassword = process.env.SEED_ADMIN_PASSWORD || "Admin123!";

const sampleUsers = [
    {
        email: "alice@example.com",
        displayName: "Alice Nguyen",
        role: "member",
    },
    {
        email: "ben@example.com",
        displayName: "Ben Carter",
        role: "member",
    },
];

const sampleChannels = [
    {
        name: "general",
        description: "General project discussion and announcements.",
    },
    {
        name: "study-tips",
        description: "Share learning strategies, study habits, and helpful resources.",
    },
];

async function upsertUser({ email, displayName, password, role }) {
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 10);

    return prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
            displayName,
            passwordHash,
            role,
        },
        create: {
            email: normalizedEmail,
            displayName,
            passwordHash,
            role,
        },
    });
}

async function ensureChannel({ name, description, createdById }) {
    return prisma.channel.upsert({
        where: { name },
        update: {
            description,
            createdById,
        },
        create: {
            name,
            description,
            createdById,
        },
    });
}

async function ensureGeneralContent({ generalChannelId, studyTipsChannelId, adminId, aliceId, benId }) {
    const existingPosts = await prisma.post.count();

    if (existingPosts > 0) {
        return;
    }

    const welcomePost = await prisma.post.create({
        data: {
            channelId: generalChannelId,
            authorId: adminId,
            title: "Welcome to the community",
            body: "This space is seeded with a few example conversations so the app has data to explore right away.",
        },
    });

    const studyPost = await prisma.post.create({
        data: {
            channelId: studyTipsChannelId,
            authorId: aliceId,
            title: "What study routine works best for long courses?",
            body: "I have been trying short daily review sessions instead of long weekly cramming. Has that worked for anyone else?",
        },
    });

    const welcomeReply = await prisma.reply.create({
        data: {
            postId: welcomePost.id,
            authorId: benId,
            body: "Thanks for setting this up. The seeded data makes it much easier to test the app flow.",
        },
    });

    await prisma.reply.create({
        data: {
            postId: welcomePost.id,
            parentReplyId: welcomeReply.id,
            authorId: adminId,
            body: "That was the goal. You can safely rerun the seed command and keep the admin account up to date.",
        },
    });

    await prisma.reply.create({
        data: {
            postId: studyPost.id,
            authorId: benId,
            body: "Pomodoro blocks plus a quick recap at the end of each week have worked well for me.",
        },
    });
}

async function main() {
    const admin = await upsertUser({
        email: adminEmail,
        displayName: adminName,
        password: adminPassword,
        role: "admin",
    });

    const [alice, ben] = await Promise.all(
        sampleUsers.map((user) =>
            upsertUser({
                ...user,
                password: "Password123!",
            }),
        ),
    );

    const [generalChannel, studyTipsChannel] = await Promise.all(
        sampleChannels.map((channel) =>
            ensureChannel({
                ...channel,
                createdById: admin.id,
            }),
        ),
    );

    await ensureGeneralContent({
        generalChannelId: generalChannel.id,
        studyTipsChannelId: studyTipsChannel.id,
        adminId: admin.id,
        aliceId: alice.id,
        benId: ben.id,
    });

    console.log("Seed completed successfully.");
    console.log(`Admin email: ${adminEmail}`);
    console.log(`Admin password: ${adminPassword}`);
}

main()
    .catch((error) => {
        console.error("Seed failed.");
        console.error(error);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
