import { NextRequest } from "next/server";
import { createAuthToken, setAuthCookie } from "@/lib/auth";
import { ApiError, handleRouteError, jsonResponse, readJsonBody } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await readJsonBody(request);

        if (typeof email !== "string" || !email.trim()) {
            throw new ApiError(400, "email must be a non-empty string");
        }

        if (typeof password !== "string" || !password.trim()) {
            throw new ApiError(400, "password must be a non-empty string");
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await prisma.user.findUnique({
            where: {
                email: normalizedEmail,
            },
        });

        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new ApiError(401, "Invalid email or password");
        }

        const token = createAuthToken({
            sub: user.id,
            role: user.role,
        });

        const response = jsonResponse({
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
            },
        });

        return setAuthCookie(response, token);
    } catch (error) {
        return handleRouteError(error);
    }
}
