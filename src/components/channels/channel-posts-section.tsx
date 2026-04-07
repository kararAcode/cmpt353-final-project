"use client";

import { MessageSquareText } from "lucide-react";

import { useAuth } from "@/app/auth-provider";
import { PostSummary } from "@/components/channels/channel-detail-types";
import { ChannelPostCard } from "@/components/channels/channel-post-card";
import { Card, CardContent } from "@/components/ui/card";

type ChannelPostsSectionProps = {
    posts: PostSummary[];
    onPostReplyCountChange: (postId: string, topLevelReplyCount: number) => void;
};

export function ChannelPostsSection({
    posts,
    onPostReplyCountChange,
}: ChannelPostsSectionProps) {
    const { isAuthenticated } = useAuth();

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
                            {isAuthenticated
                                ? "Start the conversation by publishing the first post."
                                : "Sign in to publish the first post in this channel."}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {posts.map((post) => (
                        <ChannelPostCard
                            key={post.id}
                            post={post}
                            onPostReplyCountChange={onPostReplyCountChange}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
