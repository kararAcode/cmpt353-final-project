import { expect, test } from "@playwright/test";

import { prisma, resetDatabase, seedDatabase, type SeededState } from "./helpers/db";
import { authHeaders, readJson } from "./helpers/http";

test.describe("admin and search APIs", () => {
    let seeded: SeededState;

    test.beforeEach(async () => {
        await resetDatabase();
        seeded = await seedDatabase();
    });

    test("GET /api/admin/users requires admin access and returns user summaries", async ({ request }) => {
        const unauthenticated = await request.get("/api/admin/users");
        expect(unauthenticated.status()).toBe(401);

        const member = await request.get("/api/admin/users", {
            headers: authHeaders(seeded.users.member.id),
        });
        expect(member.status()).toBe(403);

        const admin = await request.get("/api/admin/users", {
            headers: authHeaders(seeded.users.admin.id, { role: "admin" }),
        });
        expect(admin.status()).toBe(200);

        const body = await readJson(admin);
        expect(body.data).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: seeded.users.admin.id,
                    role: "admin",
                    counts: expect.objectContaining({
                        channels: 1,
                    }),
                }),
            ]),
        );
    });

    test("DELETE /api/admin/users/:userId covers self-delete, missing users, and success", async ({ request }) => {
        const unauthenticated = await request.delete(`/api/admin/users/${seeded.users.member.id}`);
        expect(unauthenticated.status()).toBe(401);

        const member = await request.delete(`/api/admin/users/${seeded.users.guest.id}`, {
            headers: authHeaders(seeded.users.member.id),
        });
        expect(member.status()).toBe(403);

        const selfDelete = await request.delete(`/api/admin/users/${seeded.users.admin.id}`, {
            headers: authHeaders(seeded.users.admin.id, { role: "admin" }),
        });
        expect(selfDelete.status()).toBe(400);

        const missing = await request.delete("/api/admin/users/missing-user", {
            headers: authHeaders(seeded.users.admin.id, { role: "admin" }),
        });
        expect(missing.status()).toBe(404);

        const success = await request.delete(`/api/admin/users/${seeded.users.guest.id}`, {
            headers: authHeaders(seeded.users.admin.id, { role: "admin" }),
        });
        expect(success.status()).toBe(200);

        const deletedUser = await prisma.user.findUnique({
            where: { id: seeded.users.guest.id },
        });
        expect(deletedUser).toBeNull();
    });

    test("GET /api/search returns filtered results and pagination metadata", async ({ request }) => {
        const filtered = await request.get(
            `/api/search?query=Playwright&author=Guest&channelId=${seeded.channels.general.id}&limit=1`,
        );

        expect(filtered.status()).toBe(200);
        const firstPage = await readJson(filtered);
        expect(firstPage.data.items).toHaveLength(1);
        expect(firstPage.data.items[0].channel.id).toBe(seeded.channels.general.id);
        expect(firstPage.data.items[0].author.displayName).toContain("Guest");
        expect(firstPage.data.nextCursor).toBeTruthy();
        expect(firstPage.data.summary.mostPosts).toBeTruthy();
        expect(firstPage.data.summary.leastPosts).toBeTruthy();

        const secondPage = await request.get(
            `/api/search?query=Playwright&limit=1&cursor=${firstPage.data.nextCursor}`,
        );
        expect(secondPage.status()).toBe(200);
        const secondBody = await readJson(secondPage);
        expect(secondBody.data.items).toHaveLength(1);
    });

    test("GET /api/search rejects invalid cursors", async ({ request }) => {
        const response = await request.get("/api/search?cursor=not-a-valid-cursor");

        expect(response.status()).toBe(400);
        expect(await readJson(response)).toMatchObject({
            error: {
                message: "Invalid cursor.",
            },
        });
    });
});
