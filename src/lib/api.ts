import { NextResponse } from "next/server";

export class ApiError extends Error {
  public readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = (await request.json()) as unknown;

    if (!isRecord(body)) {
      throw new ApiError(400, "Request body must be a JSON object.");
    }

    return body;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(400, "Request body must be valid JSON.");
  }
}

export function jsonResponse(data: unknown, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data }, init);
}

export function createdResponse(data: unknown): NextResponse {
  return jsonResponse(data, { status: 201 });
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  console.error(error);

  return NextResponse.json(
    {
      error: {
        message: "Internal server error.",
      },
    },
    { status: 500 },
  );
}
