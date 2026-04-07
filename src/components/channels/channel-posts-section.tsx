import { MessageSquareText } from "lucide-react";

import { PostSummary, formatChannelDate } from "@/components/channels/channel-detail-types";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type ChannelPostsSectionProps = {
    posts: PostSummary[];
    hasAuth: boolean;
};

export function ChannelPostsSection({ posts, hasAuth }: ChannelPostsSectionProps) {
    return (
        <section className="space-y-4">
            <div>
                <h2 className="text-2xl font-semibold text-foreground">Posts</h2>
                <p className="text-sm text-muted-foreground">
                    The latest conversations happening in this channel.
                </p>
            </div>

            {posts.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <MessageSquareText className="mx-auto h-10 w-10 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-medium text-foreground">No posts yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {hasAuth
                                ? "Start the conversation by publishing the first post."
                                : "Sign in to publish the first post in this channel."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <Card key={post.id} className="transition-shadow hover:shadow-md">
                            <CardHeader className="space-y-3">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <CardTitle>{post.title}</CardTitle>
                                        <CardDescription>
                                            Posted by {post.author.displayName} on{" "}
                                            {formatChannelDate(post.createdAt)}
                                        </CardDescription>
                                    </div>
                                    <div className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                                        Score {post.voteSummary.score}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                                    {post.body}
                                </p>
                                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    <span className="rounded-full bg-muted px-2.5 py-1">
                                        {post.topLevelReplyCount}{" "}
                                        {post.topLevelReplyCount === 1 ? "reply" : "replies"}
                                    </span>
                                    <span className="rounded-full bg-muted px-2.5 py-1">
                                        {post.voteSummary.upvotes} upvotes
                                    </span>
                                    <span className="rounded-full bg-muted px-2.5 py-1">
                                        {post.attachments.length} attachments
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </section>
    );
}
