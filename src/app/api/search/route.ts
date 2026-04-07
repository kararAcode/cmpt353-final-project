import { handleRouteError, jsonResponse } from "@/lib/api";
import { searchContent } from "@/lib/search";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const result = await searchContent({
            query: searchParams.get("query") ?? "",
            author: searchParams.get("author") ?? "",
            channelId: searchParams.get("channelId"),
            cursor: searchParams.get("cursor"),
            limit: Number(searchParams.get("limit") ?? "12"),
        });

        return jsonResponse(result, { status: 200 });
    } catch (error) {
        return handleRouteError(error);
    }
}
