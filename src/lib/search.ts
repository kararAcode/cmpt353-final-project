import { Prisma } from "@prisma/client";

import { ApiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 30;
const SNIPPET_RADIUS = 90;

type SearchCursorPayload = {
    createdAt: string;
    itemSort: number;
    id: string;
};

type SearchRow = {
    id: string;
    itemType: "post" | "reply";
    itemSort: number;
    createdAt: Date;
    channelId: string;
    channelName: string;
    authorId: string;
    authorName: string;
    postId: string;
    postTitle: string;
    content: string;
};

type SearchAuthorSummaryRow = {
    userId: string;
    displayName: string;
    postCount: bigint | number;
};

export type SearchResultItem = {
    id: string;
    itemType: "post" | "reply";
    createdAt: string;
    channel: {
        id: string;
        name: string;
    };
    author: {
        id: string;
        displayName: string;
    };
    post: {
        id: string;
        title: string;
    };
    excerpt: string;
    context: string;
    href: string;
};

export type SearchSummary = {
    mostPosts: {
        userId: string;
        displayName: string;
        postCount: number;
    } | null;
    leastPosts: {
        userId: string;
        displayName: string;
        postCount: number;
    } | null;
};

export type SearchResponse = {
    items: SearchResultItem[];
    nextCursor: string | null;
    summary: SearchSummary;
};

export type SearchInput = {
    query: string;
    author: string;
    channelId: string | null;
    cursor: string | null;
    limit: number;
};

function normalizeLimit(limit: number) {
    if (!Number.isFinite(limit) || limit <= 0) {
        return DEFAULT_LIMIT;
    }

    return Math.min(Math.floor(limit), MAX_LIMIT);
}

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildSnippet(content: string, query: string) {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
        return "";
    }

    if (!query.trim()) {
        return trimmedContent.length > SNIPPET_RADIUS * 2
            ? `${trimmedContent.slice(0, SNIPPET_RADIUS * 2).trimEnd()}...`
            : trimmedContent;
    }

    const regex = new RegExp(escapeRegExp(query.trim()), "i");
    const match = regex.exec(trimmedContent);

    if (!match) {
        return trimmedContent.length > SNIPPET_RADIUS * 2
            ? `${trimmedContent.slice(0, SNIPPET_RADIUS * 2).trimEnd()}...`
            : trimmedContent;
    }

    const start = Math.max(match.index - SNIPPET_RADIUS, 0);
    const end = Math.min(match.index + match[0].length + SNIPPET_RADIUS, trimmedContent.length);
    const prefix = start > 0 ? "..." : "";
    const suffix = end < trimmedContent.length ? "..." : "";

    return `${prefix}${trimmedContent.slice(start, end).trim()}${suffix}`;
}

function encodeCursor(payload: SearchCursorPayload) {
    return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeCursor(cursor: string | null): SearchCursorPayload | null {
    if (!cursor) {
        return null;
    }

    try {
        const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as
            | SearchCursorPayload
            | undefined;

        if (!parsed?.createdAt || !parsed.id || typeof parsed.itemSort !== "number") {
            throw new Error("Invalid cursor");
        }

        return parsed;
    } catch {
        throw new ApiError(400, "Invalid cursor.");
    }
}

async function getSummary(channelId: string | null): Promise<SearchSummary> {
    const channelFilter = channelId
        ? Prisma.sql`WHERE p."channelId" = ${channelId}`
        : Prisma.empty;

    const [mostPostsRows, leastPostsRows] = await Promise.all([
        prisma.$queryRaw<SearchAuthorSummaryRow[]>(Prisma.sql`
            SELECT
                u.id AS "userId",
                u."displayName",
                COUNT(p.id) AS "postCount"
            FROM "Post" p
            INNER JOIN "User" u ON u.id = p."authorId"
            ${channelFilter}
            GROUP BY u.id, u."displayName"
            ORDER BY COUNT(p.id) DESC, u."displayName" ASC
            LIMIT 1
        `),
        prisma.$queryRaw<SearchAuthorSummaryRow[]>(Prisma.sql`
            SELECT
                u.id AS "userId",
                u."displayName",
                COUNT(p.id) AS "postCount"
            FROM "Post" p
            INNER JOIN "User" u ON u.id = p."authorId"
            ${channelFilter}
            GROUP BY u.id, u."displayName"
            ORDER BY COUNT(p.id) ASC, u."displayName" ASC
            LIMIT 1
        `),
    ]);

    const mapSummaryUser = (row: SearchAuthorSummaryRow | undefined) =>
        row
            ? {
                  userId: row.userId,
                  displayName: row.displayName,
                  postCount: Number(row.postCount),
              }
            : null;

    return {
        mostPosts: mapSummaryUser(mostPostsRows[0]),
        leastPosts: mapSummaryUser(leastPostsRows[0]),
    };
}

export async function searchContent(input: Partial<SearchInput>): Promise<SearchResponse> {
    const query = typeof input.query === "string" ? input.query.trim() : "";
    const author = typeof input.author === "string" ? input.author.trim() : "";
    const channelId = typeof input.channelId === "string" && input.channelId.trim()
        ? input.channelId.trim()
        : null;
    const limit = normalizeLimit(input.limit ?? DEFAULT_LIMIT);
    const cursor = decodeCursor(input.cursor ?? null);

    const clauses: Prisma.Sql[] = [];

    if (channelId) {
        clauses.push(Prisma.sql`content."channelId" = ${channelId}`);
    }

    if (author) {
        clauses.push(Prisma.sql`content."authorName" ILIKE ${`%${author}%`}`);
    }

    if (query) {
        clauses.push(Prisma.sql`content.content ILIKE ${`%${query}%`}`);
    }

    if (cursor) {
        clauses.push(
            Prisma.sql`(
                content."createdAt" < ${new Date(cursor.createdAt)}
                OR (
                    content."createdAt" = ${new Date(cursor.createdAt)}
                    AND content."itemSort" > ${cursor.itemSort}
                )
                OR (
                    content."createdAt" = ${new Date(cursor.createdAt)}
                    AND content."itemSort" = ${cursor.itemSort}
                    AND content.id < ${cursor.id}
                )
            )`,
        );
    }

    const whereClause = clauses.length
        ? Prisma.sql`WHERE ${Prisma.join(clauses, " AND ")}`
        : Prisma.empty;

    const rows = await prisma.$queryRaw<SearchRow[]>(Prisma.sql`
        WITH content AS (
            SELECT
                p.id,
                'post'::text AS "itemType",
                0 AS "itemSort",
                p."createdAt",
                p."channelId",
                c.name AS "channelName",
                u.id AS "authorId",
                u."displayName" AS "authorName",
                p.id AS "postId",
                p.title AS "postTitle",
                CONCAT_WS(E'\n\n', p.title, p.body) AS content
            FROM "Post" p
            INNER JOIN "Channel" c ON c.id = p."channelId"
            INNER JOIN "User" u ON u.id = p."authorId"

            UNION ALL

            SELECT
                r.id,
                'reply'::text AS "itemType",
                1 AS "itemSort",
                r."createdAt",
                p."channelId",
                c.name AS "channelName",
                u.id AS "authorId",
                u."displayName" AS "authorName",
                p.id AS "postId",
                p.title AS "postTitle",
                r.body AS content
            FROM "Reply" r
            INNER JOIN "Post" p ON p.id = r."postId"
            INNER JOIN "Channel" c ON c.id = p."channelId"
            INNER JOIN "User" u ON u.id = r."authorId"
        )
        SELECT
            content.id,
            content."itemType",
            content."itemSort",
            content."createdAt",
            content."channelId",
            content."channelName",
            content."authorId",
            content."authorName",
            content."postId",
            content."postTitle",
            content.content
        FROM content
        ${whereClause}
        ORDER BY content."createdAt" DESC, content."itemSort" ASC, content.id DESC
        LIMIT ${limit + 1}
    `);

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const lastRow = pageRows.at(-1);

    const items = pageRows.map((row) => ({
        id: row.id,
        itemType: row.itemType,
        createdAt: row.createdAt.toISOString(),
        channel: {
            id: row.channelId,
            name: row.channelName,
        },
        author: {
            id: row.authorId,
            displayName: row.authorName,
        },
        post: {
            id: row.postId,
            title: row.postTitle,
        },
        excerpt: buildSnippet(row.content, query),
        context:
            row.itemType === "post"
                ? `Post in #${row.channelName}`
                : `Reply in "${row.postTitle}" in #${row.channelName}`,
        href:
            row.itemType === "post"
                ? `/channels/${row.channelId}?postId=${row.postId}#post-${row.postId}`
                : `/channels/${row.channelId}?postId=${row.postId}&replyId=${row.id}#post-${row.postId}`,
    }));

    return {
        items,
        nextCursor:
            hasMore && lastRow
                ? encodeCursor({
                      createdAt: lastRow.createdAt.toISOString(),
                      itemSort: lastRow.itemSort,
                      id: lastRow.id,
                  })
                : null,
        summary: await getSummary(channelId),
    };
}
