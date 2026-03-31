import { jwtVerify } from "jose";

import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

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

export function requireBearerToken(request: Request): string {
  const token = getBearerToken(request);

  if (!token) {
    throw new ApiError(401, "Missing or invalid Bearer token.");
  }

  return token;
}

type JwtPayload = {
  sub?: unknown;
};

export async function requireAuthenticatedUser(request: Request) {
  const token = requireBearerToken(request);
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new ApiError(500, "JWT_SECRET is not configured.");
  }

  let payload: JwtPayload;

  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret));
    payload = verified.payload as JwtPayload;
  } catch {
    throw new ApiError(401, "Invalid Bearer token.");
  }

  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new ApiError(401, "Bearer token is missing a valid sub claim.");
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      displayName: true,
      role: true,
    },
  });

  if (!user) {
    throw new ApiError(401, "Authenticated user was not found.");
  }

  return user;
}
