import {
  ApiError,
  handleRouteError,
  jsonResponse,
  readJsonBody,
} from "@/lib/api";
import { requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const channels = await prisma.channel.findMany({
    include: {
      _count: {
        select: {
          posts: true,
        },
      },
    },
  });

  const result = channels.map((channel) => ({
    id: channel.id,
    name: channel.name,
    description: channel.description,
    postCount: channel._count.posts,
  }));

  return jsonResponse(result, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuthenticatedUser(request);
    const body = await readJsonBody(request);

    if (!body.name) {
        throw new ApiError(400, "name is required.");    
    } 

    const newChannel = await prisma.channel.create({
      data: {
        name: body.name as string,
        createdById: user.id,
      },
    });

    return NextResponse.json({ data: newChannel }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
