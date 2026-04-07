"use client";

import { useState } from "react";

import { useAuth } from "@/app/auth-provider";
import {
    PostDetail,
    PostSummary,
    formatChannelDate,
} from "@/components/channels/channel-detail-types";
import {
    ReplyComposer,
    ReplyList,
} from "@/components/channels/channel-post-thread";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type ChannelPostCardProps = {
    post: PostSummary;
    onPostReplyCountChange: (postId: string, topLevelReplyCount: number) => void;
};

export function ChannelPostCard({
    post,
    onPostReplyCountChange,
}: ChannelPostCardProps) {
    const { isAuthenticated } = useAuth();
    const [detail, setDetail] = useState<PostDetail | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);
    const [detailError, setDetailError] = useState("");
    const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
    const [replyError, setReplyError] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);

    async function loadDetail(force = false) {
        if (detail && !force) {
            return detail;
        }

        try {
            setIsLoadingReplies(true);
            setDetailError("");

            const response = await fetch(`/api/posts/${post.id}`);
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error?.message || "Failed to load replies.");
            }

            const nextDetail = result.data as PostDetail;
            setDetail(nextDetail);
            onPostReplyCountChange(post.id, nextDetail.post.topLevelReplyCount);

            return nextDetail;
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Failed to load replies.";
            setDetailError(message);
            throw error;
        } finally {
            setIsLoadingReplies(false);
        }
    }

    async function handleToggleReplies() {
        if (isExpanded) {
            setIsExpanded(false);
            setReplyTargetId(null);
            setReplyError("");
            return;
        }

        try {
            await loadDetail();
            setIsExpanded(true);
        } catch {}
    }

    async function submitReply(targetId: string, body: string) {
        const endpoint =
            targetId === post.id
                ? `/api/posts/${post.id}/replies`
                : `/api/replies/${targetId}/replies`;

        try {
            setIsSubmittingReply(true);
            setReplyError("");

            const formData = new FormData();
            formData.set("body", body);

            const response = await fetch(endpoint, {
                method: "POST",
                body: formData,
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error?.message || "Failed to create reply.");
            }

            await loadDetail(true);
            setIsExpanded(true);
            setReplyTargetId(null);
            return true;
        } catch (error) {
            setReplyError(error instanceof Error ? error.message : "Failed to create reply.");
            return false;
        } finally {
            setIsSubmittingReply(false);
        }
    }

    return (
        <Card className="transition-shadow hover:shadow-md">
            <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle>{post.title}</CardTitle>
                        <CardDescription>
                            Posted by {post.author.displayName} on {formatChannelDate(post.createdAt)}
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
                <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" onClick={handleToggleReplies}>
                        {isExpanded ? "Hide replies" : "Show replies"}
                    </Button>
                    {isAuthenticated ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={async () => {
                                try {
                                    await loadDetail();
                                    setIsExpanded(true);
                                    setReplyError("");
                                    setReplyTargetId(post.id);
                                } catch {}
                            }}
                        >
                            Reply
                        </Button>
                    ) : null}
                </div>
                {isExpanded ? (
                    <div className="space-y-4 rounded-lg border border-border/70 bg-background p-4 sm:p-5">
                        {replyTargetId === post.id ? (
                            <ReplyComposer
                                error={replyError}
                                isSubmitting={isSubmittingReply}
                                onCancel={() => {
                                    setReplyTargetId(null);
                                    setReplyError("");
                                }}
                                onSubmit={(body) => submitReply(post.id, body)}
                            />
                        ) : null}
                        {isLoadingReplies ? (
                            <p className="text-sm text-muted-foreground">Loading replies...</p>
                        ) : detailError ? (
                            <p className="text-sm text-destructive">{detailError}</p>
                        ) : detail?.replies.length ? (
                            <ReplyList
                                replies={detail.replies}
                                isAuthenticated={isAuthenticated}
                                replyTargetId={replyTargetId}
                                replyError={replyError}
                                isSubmittingReply={isSubmittingReply}
                                onReplyClick={(replyId) => {
                                    setReplyTargetId(replyId);
                                    setReplyError("");
                                }}
                                onReplySubmit={submitReply}
                                onReplyCancel={() => {
                                    setReplyTargetId(null);
                                    setReplyError("");
                                }}
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground">No replies yet.</p>
                        )}
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}
