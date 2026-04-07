import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { jwtVerify } from "jose";
import { NextResponse } from "next/server";

import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE_NAME = "auth_token";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
} | null;

function parseBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token.trim() || null;
}

export function getBearerToken(request: Request): string | null {
  return parseBearerToken(request.headers.get("authorization"));
}

export function getAuthTokenFromRequest(request: Request): string | null {
  return getBearerToken(request) ?? request.headers.get("cookie")
    ?.split(";")
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${AUTH_COOKIE_NAME}=`))
    ?.slice(`${AUTH_COOKIE_NAME}=`.length) ?? null;
}

type JwtPayload = {
  sub?: unknown;
};

type AuthTokenPayload = {
  sub: string;
  role: string;
};

export function createAuthToken(payload: AuthTokenPayload): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new ApiError(500, "JWT_SECRET is not configured.");
  }

  return jwt.sign(payload, secret, {
    expiresIn: "7d",
  });
}

export function setAuthCookie(response: NextResponse, token: string) {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });

  return response;
}

async function verifyAuthToken(token: string): Promise<JwtPayload> {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new ApiError(500, "JWT_SECRET is not configured.");
  }

  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret));
    return verified.payload as JwtPayload;
  } catch {
    throw new ApiError(401, "Invalid authentication token.");
  }
}

async function getUserFromToken(token: string): Promise<AuthUser> {
  const payload = await verifyAuthToken(token);

  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new ApiError(401, "Authentication token is missing a valid sub claim.");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      displayName: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "Authenticated user was not found.");
  }

  return user;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    return await getUserFromToken(token);
  } catch {
    return null;
  }
}

export async function requireAuthenticatedUser(request: Request) {
  const token = getAuthTokenFromRequest(request);

  if (!token) {
    throw new ApiError(401, "Missing authentication token.");
  }

  return getUserFromToken(token);
}
