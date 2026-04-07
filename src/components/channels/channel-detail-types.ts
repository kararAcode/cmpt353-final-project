export type ChannelDetail = {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    createdBy: {
        id: string;
        displayName: string;
    };
    postCount: number;
};

export type PostSummary = {
    id: string;
    title: string;
    body: string;
    createdAt: string;
    author: {
        id: string;
        displayName: string;
    };
    attachments: Array<{
        id: string;
    }>;
    topLevelReplyCount: number;
    voteSummary: {
        upvotes: number;
        downvotes: number;
        score: number;
    };
};

export function formatChannelDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}
