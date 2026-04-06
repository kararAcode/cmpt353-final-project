import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
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

        const secret = process.env.JWT_SECRET;

        if (!secret) {
            throw new ApiError(500, "JWT_SECRET is not configured.");
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

        const token = jwt.sign(
            {
                sub: user.id,
                role: user.role,
            },
            secret,
            {
                expiresIn: "7d",
            },
        );

        return jsonResponse({
            token,
            user: {
                id: user.id,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
            },
        });
    } catch (error) {
        return handleRouteError(error);
    }
}
