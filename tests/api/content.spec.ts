import { expect, test } from "@playwright/test";

import { resetDatabase, seedDatabase, type SeededState } from "./helpers/db";
import { authHeaders, pngFilePayload, readJson } from "./helpers/http";

test.describe("post, reply, and vote APIs", () => {
    let seeded: SeededState;

    test.beforeEach(async () => {
        await resetDatabase();
        seeded = await seedDatabase();
    });

    test("GET /api/channels/:channelId/posts returns enriched posts for the current user", async ({ request }) => {
        const response = await request.get(`/api/channels/${seeded.channels.general.id}/posts`, {
            headers: authHeaders(seeded.users.member.id),
        });

        expect(response.status()).toBe(200);
        const body = await readJson(response);
        const testingPost = body.data.find((post: { id: string }) => post.id === seeded.posts.testing.id);

        expect(testingPost).toBeTruthy();
        expect(testingPost.currentUserVote).toBe(1);
        expect(testingPost.topLevelReplyCount).toBe(1);
        expect(testingPost.voteSummary).toEqual({
            upvotes: 1,
            downvotes: 1,
            score: 0,
        });
        expect(testingPost.attachments).toHaveLength(1);
    });

    test("POST /api/channels/:channelId/posts covers auth, validation, not found, and success", async ({ request }) => {
        const unauthenticated = await request.post(`/api/channels/${seeded.channels.general.id}/posts`, {
            multipart: {
                title: "Unauthorized post",
                body: "This should fail",
            },
        });
        expect(unauthenticated.status()).toBe(401);

        const missingFields = await request.post(`/api/channels/${seeded.channels.general.id}/posts`, {
            headers: authHeaders(seeded.users.member.id),
            multipart: {
                title: "",
            },
        });
        expect(missingFields.status()).toBe(400);

        const missingChannel = await request.post("/api/channels/missing-channel/posts", {
            headers: authHeaders(seeded.users.member.id),
            multipart: {
                title: "Missing channel",
                body: "No target channel here",
            },
        });
        expect(missingChannel.status()).toBe(404);

        const success = await request.post(`/api/channels/${seeded.channels.general.id}/posts`, {
            headers: authHeaders(seeded.users.member.id),
            multipart: {
                title: "Uploaded screenshots",
                body: "This post includes an attachment",
                attachments: pngFilePayload(),
            },
        });
        expect(success.status()).toBe(201);
        const successBody = await readJson(success);
        expect(successBody.data.post.title).toBe("Uploaded screenshots");
        expect(successBody.data.attachments).toHaveLength(1);
    });

    test("POST /api/channels/:channelId/posts rejects invalid attachment types", async ({ request }) => {
        const response = await request.post(`/api/channels/${seeded.channels.general.id}/posts`, {
            headers: authHeaders(seeded.users.member.id),
            multipart: {
                title: "Bad attachment",
                body: "This upload should fail",
                attachments: {
                    name: "not-an-image.txt",
                    mimeType: "text/plain",
                    buffer: Buffer.from("plain text"),
                },
            },
        });

        expect(response.status()).toBe(400);
    });

    test("GET /api/posts/:postId returns the post detail tree", async ({ request }) => {
        const response = await request.get(`/api/posts/${seeded.posts.testing.id}`, {
            headers: authHeaders(seeded.users.member.id),
        });

        expect(response.status()).toBe(200);
        const body = await readJson(response);
        expect(body.data.post.id).toBe(seeded.posts.testing.id);
        expect(body.data.post.topLevelReplyCount).toBe(1);
        expect(body.data.replies[0].replies[0].id).toBe(seeded.replies.nested.id);
    });

    test("GET /api/posts/:postId returns 404 for missing posts", async ({ request }) => {
        const response = await request.get("/api/posts/missing-post");

        expect(response.status()).toBe(404);
    });

    test("DELETE /api/posts/:postId enforces admin-only deletion and deletes for admins", async ({ request }) => {
        const unauthenticated = await request.delete(`/api/posts/${seeded.posts.testing.id}`);
        expect(unauthenticated.status()).toBe(401);

        const member = await request.delete(`/api/posts/${seeded.posts.testing.id}`, {
            headers: authHeaders(seeded.users.member.id),
        });
        expect(member.status()).toBe(403);

        const missing = await request.delete("/api/posts/missing-post", {
            headers: authHeaders(seeded.users.admin.id, { role: "admin" }),
        });
        expect(missing.status()).toBe(404);

        const success = await request.delete(`/api/posts/${seeded.posts.testing.id}`, {
            headers: authHeaders(seeded.users.admin.id, { role: "admin" }),
        });
        expect(success.status()).toBe(200);
    });

    test("POST /api/posts/:postId/replies validates auth, missing fields, not found, and success", async ({ request }) => {
        const unauthenticated = await request.post(`/api/posts/${seeded.posts.testing.id}/replies`, {
            multipart: {
                body: "Unauthorized reply",
            },
        });
        expect(unauthenticated.status()).toBe(401);

        const missingBody = await request.post(`/api/posts/${seeded.posts.testing.id}/replies`, {
            headers: authHeaders(seeded.users.member.id),
            multipart: {},
        });
        expect(missingBody.status()).toBe(400);

        const missingPost = await request.post("/api/posts/missing-post/replies", {
            headers: authHeaders(seeded.users.member.id),
            multipart: {
                body: "No post here",
            },
        });
        expect(missingPost.status()).toBe(404);

        const success = await request.post(`/api/posts/${seeded.posts.testing.id}/replies`, {
            headers: authHeaders(seeded.users.member.id),
            multipart: {
                body: "Top-level reply created from a test",
                attachments: pngFilePayload("reply.png"),
            },
        });
        expect(success.status()).toBe(201);
    });

    test("POST /api/posts/:postId/vote validates auth, missing values, not found, and vote removal", async ({ request }) => {
        const unauthenticated = await request.post(`/api/posts/${seeded.posts.testing.id}/vote`, {
            data: { value: 1 },
        });
        expect(unauthenticated.status()).toBe(401);

        const missingValue = await request.post(`/api/posts/${seeded.posts.testing.id}/vote`, {
            headers: authHeaders(seeded.users.member.id),
            data: {},
        });
        expect(missingValue.status()).toBe(400);

        const missingPost = await request.post("/api/posts/missing-post/vote", {
            headers: authHeaders(seeded.users.member.id),
            data: { value: 1 },
        });
        expect(missingPost.status()).toBe(404);

        const upvote = await request.post(`/api/posts/${seeded.posts.prisma.id}/vote`, {
            headers: authHeaders(seeded.users.member.id),
            data: { value: 1 },
        });
        expect(upvote.status()).toBe(200);

        const removed = await request.post(`/api/posts/${seeded.posts.prisma.id}/vote`, {
            headers: authHeaders(seeded.users.member.id),
            data: { value: 0 },
        });
        expect(removed.status()).toBe(200);
        const body = await readJson(removed);
        expect(body.data.currentUserVote).toBeNull();
    });

    test("DELETE /api/replies/:replyId enforces admin-only deletion", async ({ request }) => {
        const unauthenticated = await request.delete(`/api/replies/${seeded.replies.topLevel.id}`);
        expect(unauthenticated.status()).toBe(401);

        const member = await request.delete(`/api/replies/${seeded.replies.topLevel.id}`, {
            headers: authHeaders(seeded.users.member.id),
        });
        expect(member.status()).toBe(403);

        const missing = await request.delete("/api/replies/missing-reply", {
            headers: authHeaders(seeded.users.admin.id, { role: "admin" }),
        });
        expect(missing.status()).toBe(404);

        const success = await request.delete(`/api/replies/${seeded.replies.topLevel.id}`, {
            headers: authHeaders(seeded.users.admin.id, { role: "admin" }),
        });
        expect(success.status()).toBe(200);
    });

    test("POST /api/replies/:replyId/replies validates auth, missing fields, not found, and success", async ({ request }) => {
        const unauthenticated = await request.post(`/api/replies/${seeded.replies.topLevel.id}/replies`, {
            multipart: {
                body: "Unauthorized nested reply",
            },
        });
        expect(unauthenticated.status()).toBe(401);

        const missingBody = await request.post(`/api/replies/${seeded.replies.topLevel.id}/replies`, {
            headers: authHeaders(seeded.users.member.id),
            multipart: {},
        });
        expect(missingBody.status()).toBe(400);

        const missingReply = await request.post("/api/replies/missing-reply/replies", {
            headers: authHeaders(seeded.users.member.id),
            multipart: {
                body: "No parent reply here",
            },
        });
        expect(missingReply.status()).toBe(404);

        const success = await request.post(`/api/replies/${seeded.replies.topLevel.id}/replies`, {
            headers: authHeaders(seeded.users.member.id),
            multipart: {
                body: "Nested reply from Playwright",
                attachments: pngFilePayload("nested.png"),
            },
        });
        expect(success.status()).toBe(201);
    });

    test("POST /api/replies/:replyId/vote validates auth, missing values, not found, and success", async ({ request }) => {
        const unauthenticated = await request.post(`/api/replies/${seeded.replies.topLevel.id}/vote`, {
            data: { value: 1 },
        });
        expect(unauthenticated.status()).toBe(401);

        const missingValue = await request.post(`/api/replies/${seeded.replies.topLevel.id}/vote`, {
            headers: authHeaders(seeded.users.member.id),
            data: {},
        });
        expect(missingValue.status()).toBe(400);

        const missingReply = await request.post("/api/replies/missing-reply/vote", {
            headers: authHeaders(seeded.users.member.id),
            data: { value: 1 },
        });
        expect(missingReply.status()).toBe(404);

        const success = await request.post(`/api/replies/${seeded.replies.prisma.id}/vote`, {
            headers: authHeaders(seeded.users.member.id),
            data: { value: -1 },
        });
        expect(success.status()).toBe(200);
        const body = await readJson(success);
        expect(body.data.currentUserVote).toBe(-1);
        expect(body.data.voteSummary.score).toBe(-1);
    });
});
