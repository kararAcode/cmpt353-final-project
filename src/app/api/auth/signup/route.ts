import { ApiError, handleRouteError, readJsonBody } from "@/lib/api";
import { createAuthToken, setAuthCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
    try {
        const { name, email, password } = await readJsonBody(request);

        if (typeof name !== "string" || !name.trim()) {
            throw new ApiError(400, "name must be a non-empty string");
        }

        if (typeof email !== "string" || !email.trim()) {
            throw new ApiError(400, "email must be a non-empty string");
        }

        if (typeof password !== "string" || !password.trim()) {
            throw new ApiError(400, "password must be a non-empty string");
        }

        const normalizedEmail = email.trim().toLowerCase();
        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                displayName: name.trim(),
                email: normalizedEmail,
                passwordHash,
                role: "member",
            },
            select: {
                id: true,
                email: true,
                displayName: true,
                role: true,
                createdAt: true,
            },
        });

        const token = createAuthToken({
            sub: user.id,
            role: user.role,
        });

        const response = NextResponse.json({ data: user });

        return setAuthCookie(response, token);
    } catch (error) {
        if (
            typeof error === "object" &&
            error !== null &&
            "code" in error &&
            error.code === "P2002"
        ) {
            return handleRouteError(new ApiError(409, "An account with that email already exists."));
        }

        return handleRouteError(error);
    }
}
