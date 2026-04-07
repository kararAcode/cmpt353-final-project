export type ChannelOption = {
    id: string;
    name: string;
};

export type SearchSummaryUser = {
    userId: string;
    displayName: string;
    postCount: number;
};

export type SearchItem = {
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

export type SearchResponse = {
    items: SearchItem[];
    nextCursor: string | null;
    summary: {
        mostPosts: SearchSummaryUser | null;
        leastPosts: SearchSummaryUser | null;
    };
};
