export type AttachmentSummary = {
    id: string;
    path: string;
    mimeType: string;
    sizeBytes: number;
};

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
    attachments: AttachmentSummary[];
    topLevelReplyCount: number;
    voteSummary: {
        upvotes: number;
        downvotes: number;
        score: number;
    };
};

export type ReplySummary = {
    id: string;
    postId: string;
    parentReplyId: string | null;
    body: string;
    createdAt: string;
    author: {
        id: string;
        displayName: string;
    };
    attachments: AttachmentSummary[];
    voteSummary: {
        upvotes: number;
        downvotes: number;
        score: number;
    };
    replies: ReplySummary[];
};

export type PostDetail = {
    post: PostSummary;
    replies: ReplySummary[];
};

export function formatChannelDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(new Date(value));
}
