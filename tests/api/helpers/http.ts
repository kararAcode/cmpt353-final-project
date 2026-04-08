import type { APIResponse } from "@playwright/test";
import jwt from "jsonwebtoken";

import { TEST_JWT_SECRET } from "./env";

type AuthHeaderOptions = {
    role?: string;
};

export function authHeaders(userId: string, options: AuthHeaderOptions = {}) {
    const token = jwt.sign(
        {
            sub: userId,
            role: options.role ?? "member",
        },
        TEST_JWT_SECRET,
        { expiresIn: "7d" },
    );

    return {
        cookie: `auth_token=${token}`,
    };
}

export function pngFilePayload(name = "screenshot.png") {
    return {
        name,
        mimeType: "image/png",
        buffer: Buffer.from("playwright-test-image"),
    };
}

export async function readJson(response: APIResponse) {
    return response.json() as Promise<Record<string, any>>;
}
