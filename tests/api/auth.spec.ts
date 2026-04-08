import { expect, test } from "@playwright/test";

import { resetDatabase, seedDatabase } from "./helpers/db";
import { TEST_USERS } from "./helpers/env";
import { readJson } from "./helpers/http";

test.describe("auth API", () => {
    test.beforeEach(async () => {
        await resetDatabase();
        await seedDatabase();
    });

    test("POST /api/auth/signup creates a user and sets an auth cookie", async ({ request }) => {
        const response = await request.post("/api/auth/signup", {
            data: {
                name: "New Member",
                email: "new-user@example.com",
                password: "SuperSecret123!",
            },
        });

        expect(response.status()).toBe(200);
        expect(response.headers()["set-cookie"]).toContain("auth_token=");

        const body = await readJson(response);
        expect(body.data.email).toBe("new-user@example.com");
        expect(body.data.displayName).toBe("New Member");
        expect(body.data.role).toBe("member");
    });

    test("POST /api/auth/signup rejects invalid payloads", async ({ request }) => {
        const response = await request.post("/api/auth/signup", {
            data: {
                name: "",
                email: "",
                password: "",
            },
        });

        expect(response.status()).toBe(400);
        expect(await readJson(response)).toMatchObject({
            error: {
                message: "name must be a non-empty string",
            },
        });
    });

    test("POST /api/auth/signup rejects duplicate emails", async ({ request }) => {
        const response = await request.post("/api/auth/signup", {
            data: {
                name: "Duplicate User",
                email: TEST_USERS.member.email,
                password: "DuplicatePass123!",
            },
        });

        expect(response.status()).toBe(409);
        expect(await readJson(response)).toMatchObject({
            error: {
                message: "An account with that email already exists.",
            },
        });
    });

    test("POST /api/auth/signin returns the signed-in user and cookie", async ({ request }) => {
        const response = await request.post("/api/auth/signin", {
            data: {
                email: TEST_USERS.member.email,
                password: TEST_USERS.member.password,
            },
        });

        expect(response.status()).toBe(200);
        expect(response.headers()["set-cookie"]).toContain("auth_token=");

        const body = await readJson(response);
        expect(body.data.user.email).toBe(TEST_USERS.member.email);
        expect(body.data.user.displayName).toBe(TEST_USERS.member.displayName);
    });

    test("POST /api/auth/signin rejects invalid credentials", async ({ request }) => {
        const response = await request.post("/api/auth/signin", {
            data: {
                email: TEST_USERS.member.email,
                password: "wrong-password",
            },
        });

        expect(response.status()).toBe(401);
        expect(await readJson(response)).toMatchObject({
            error: {
                message: "Invalid email or password",
            },
        });
    });

    test("POST /api/auth/signin validates required fields", async ({ request }) => {
        const response = await request.post("/api/auth/signin", {
            data: {
                email: "",
                password: "",
            },
        });

        expect(response.status()).toBe(400);
        expect(await readJson(response)).toMatchObject({
            error: {
                message: "email must be a non-empty string",
            },
        });
    });

    test("POST /api/auth/logout clears the auth cookie", async ({ request }) => {
        const response = await request.post("/api/auth/logout");

        expect(response.status()).toBe(200);
        expect(response.headers()["set-cookie"]).toContain("Max-Age=0");

        const body = await readJson(response);
        expect(body.data.success).toBe(true);
    });
});
