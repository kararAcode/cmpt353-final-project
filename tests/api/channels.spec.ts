import { expect, test } from "@playwright/test";

import { prisma, resetDatabase, seedDatabase, type SeededState } from "./helpers/db";
import { authHeaders, readJson } from "./helpers/http";

test.describe("channel API", () => {
    let seeded: SeededState;

    test.beforeEach(async () => {
        await resetDatabase();
        seeded = await seedDatabase();
    });

    test("GET /api/channels lists channels with post counts", async ({ request }) => {
        const response = await request.get("/api/channels");

        expect(response.status()).toBe(200);
        const body = await readJson(response);

        expect(body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: seeded.channels.general.id,
                    name: "general",
                    postCount: 2,
                }),
                expect.objectContaining({
                    id: seeded.channels.random.id,
                    name: "random",
                    postCount: 1,
                }),
            ]),
        );
    });

    test("POST /api/channels requires authentication", async ({ request }) => {
        const response = await request.post("/api/channels", {
            data: { name: "announcements" },
        });

        expect(response.status()).toBe(401);
    });

    test("POST /api/channels validates required fields", async ({ request }) => {
        const response = await request.post("/api/channels", {
            headers: authHeaders(seeded.users.member.id),
            data: {},
        });

        expect(response.status()).toBe(400);
        expect(await readJson(response)).toMatchObject({
            error: {
                message: "name is required.",
            },
        });
    });

    test("POST /api/channels creates a channel for authenticated users", async ({ request }) => {
        const response = await request.post("/api/channels", {
            headers: authHeaders(seeded.users.member.id),
            data: { name: "announcements" },
        });

        expect(response.status()).toBe(201);
        const body = await readJson(response);
        expect(body.data.name).toBe("announcements");
        expect(body.data.createdById).toBe(seeded.users.member.id);
    });

    test("GET /api/channels/:channelId returns channel details", async ({ request }) => {
        const response = await request.get(`/api/channels/${seeded.channels.general.id}`);

        expect(response.status()).toBe(200);
        const body = await readJson(response);
        expect(body.data.name).toBe("general");
        expect(body.data.createdBy.displayName).toBe("Admin User");
        expect(body.data.postCount).toBe(2);
    });

    test("GET /api/channels/:channelId returns 404 for missing channels", async ({ request }) => {
        const response = await request.get("/api/channels/missing-channel");

        expect(response.status()).toBe(404);
    });

    test("DELETE /api/channels/:channelId requires authentication", async ({ request }) => {
        const response = await request.delete(`/api/channels/${seeded.channels.general.id}`);

        expect(response.status()).toBe(401);
    });

    test("DELETE /api/channels/:channelId requires admin access", async ({ request }) => {
        const response = await request.delete(`/api/channels/${seeded.channels.general.id}`, {
            headers: authHeaders(seeded.users.member.id),
        });

        expect(response.status()).toBe(403);
    });

    test("DELETE /api/channels/:channelId returns 404 for unknown channels", async ({ request }) => {
        const response = await request.delete("/api/channels/missing-channel", {
            headers: authHeaders(seeded.users.admin.id, { role: "admin" }),
        });

        expect(response.status()).toBe(404);
    });

    test("DELETE /api/channels/:channelId deletes a channel tree for admins", async ({ request }) => {
        const response = await request.delete(`/api/channels/${seeded.channels.general.id}`, {
            headers: authHeaders(seeded.users.admin.id, { role: "admin" }),
        });

        expect(response.status()).toBe(200);
        const body = await readJson(response);
        expect(body.data.deleted.type).toBe("channel");
        expect(body.data.deleted.counts.channels).toBe(1);
        expect(body.data.deleted.counts.posts).toBe(2);

        const channel = await prisma.channel.findUnique({
            where: { id: seeded.channels.general.id },
        });
        expect(channel).toBeNull();
    });
});
