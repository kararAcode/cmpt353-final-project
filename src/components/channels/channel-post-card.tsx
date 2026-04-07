"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { useAuth } from "@/app/auth-provider";
import { AttachmentGallery } from "@/components/channels/attachment-gallery";
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
import { cn } from "@/lib/utils";

type ChannelPostCardProps = {
    post: PostSummary;
    onPostReplyCountChange: (postId: string, topLevelReplyCount: number) => void;
};

export function ChannelPostCard({
    post,
    onPostReplyCountChange,
}: ChannelPostCardProps) {
    const { isAuthenticated } = useAuth();
    const [postState, setPostState] = useState(post);
    const [detail, setDetail] = useState<PostDetail | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoadingReplies, setIsLoadingReplies] = useState(false);
    const [detailError, setDetailError] = useState("");
    const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
    const [replyError, setReplyError] = useState("");
    const [isSubmittingReply, setIsSubmittingReply] = useState(false);
    const [isSubmittingPostVote, setIsSubmittingPostVote] = useState(false);
    const [votingReplyId, setVotingReplyId] = useState<string | null>(null);

    useEffect(() => {
        setPostState(post);
    }, [post]);

    function applyVoteSummary(summary: {
        upvotes: number;
        downvotes: number;
        score: number;
    }) {
        return {
            upvotes: summary.upvotes,
            downvotes: summary.downvotes,
            score: summary.upvotes - summary.downvotes,
        };
    }

    function updateReplyVoteState(
        replies: PostDetail["replies"],
        replyId: string,
        voteSummary: { upvotes: number; downvotes: number; score: number },
        currentUserVote: number | null,
    ): PostDetail["replies"] {
        return replies.map((reply) => {
            if (reply.id === replyId) {
                return {
                    ...reply,
                    currentUserVote,
                    voteSummary: applyVoteSummary(voteSummary),
                };
            }

            if (reply.replies.length === 0) {
                return reply;
            }

            return {
                ...reply,
                replies: updateReplyVoteState(
                    reply.replies,
                    replyId,
                    voteSummary,
                    currentUserVote,
                ),
            };
        });
    }

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
            setPostState(nextDetail.post);
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

    async function submitReply(targetId: string, body: string, files: File[]) {
        const endpoint =
            targetId === post.id
                ? `/api/posts/${post.id}/replies`
                : `/api/replies/${targetId}/replies`;

        try {
            setIsSubmittingReply(true);
            setReplyError("");

            const formData = new FormData();
            formData.set("body", body);
            for (const file of files) {
                formData.append("attachments", file);
            }

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

    async function handlePostVote(nextVote: number) {
        try {
            setIsSubmittingPostVote(true);
            setDetailError("");

            const response = await fetch(`/api/posts/${post.id}/vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ value: nextVote }),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error?.message || "Failed to update vote.");
            }

            const currentUserVote = result.data.currentUserVote as number | null;
            const voteSummary = applyVoteSummary(result.data.voteSummary);

            setPostState((current) => ({
                ...current,
                currentUserVote,
                voteSummary,
            }));
            setDetail((current) =>
                current
                    ? {
                          ...current,
                          post: {
                              ...current.post,
                              currentUserVote,
                              voteSummary,
                          },
                      }
                    : current,
            );
        } catch (error) {
            setDetailError(error instanceof Error ? error.message : "Failed to update vote.");
        } finally {
            setIsSubmittingPostVote(false);
        }
    }

    async function handleReplyVote(replyId: string, nextVote: number) {
        try {
            setVotingReplyId(replyId);
            setDetailError("");

            const response = await fetch(`/api/replies/${replyId}/vote`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ value: nextVote }),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error?.message || "Failed to update vote.");
            }

            setDetail((current) =>
                current
                    ? {
                          ...current,
                          replies: updateReplyVoteState(
                              current.replies,
                              replyId,
                              result.data.voteSummary,
                              result.data.currentUserVote as number | null,
                          ),
                      }
                    : current,
            );
        } catch (error) {
            setDetailError(error instanceof Error ? error.message : "Failed to update vote.");
        } finally {
            setVotingReplyId(null);
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
                    <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1">
                        <button
                            type="button"
                            className={cn(
                                "inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
                                postState.currentUserVote === 1 && "bg-background text-foreground",
                            )}
                            disabled={!isAuthenticated || isSubmittingPostVote}
                            onClick={() =>
                                void handlePostVote(postState.currentUserVote === 1 ? 0 : 1)
                            }
                            aria-label="Upvote post"
                        >
                            <ChevronUp className="h-4 w-4" />
                        </button>
                        <div className="min-w-14 px-2 text-center">
                            <p className="text-xs font-medium text-muted-foreground">Score</p>
                            <p className="text-sm font-semibold text-foreground">
                                {postState.voteSummary.score}
                            </p>
                        </div>
                        <button
                            type="button"
                            className={cn(
                                "inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
                                postState.currentUserVote === -1 && "bg-background text-foreground",
                            )}
                            disabled={!isAuthenticated || isSubmittingPostVote}
                            onClick={() =>
                                void handlePostVote(postState.currentUserVote === -1 ? 0 : -1)
                            }
                            aria-label="Downvote post"
                        >
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                    {postState.body}
                </p>
                <AttachmentGallery attachments={postState.attachments} />
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-muted px-2.5 py-1">
                        {postState.topLevelReplyCount}{" "}
                        {postState.topLevelReplyCount === 1 ? "reply" : "replies"}
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1">
                        {postState.voteSummary.upvotes} upvotes
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1">
                        {postState.voteSummary.downvotes} downvotes
                    </span>
                    <span className="rounded-full bg-muted px-2.5 py-1">
                        {postState.attachments.length} attachments
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
                                onSubmit={(body, files) => submitReply(post.id, body, files)}
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
                                votingReplyId={votingReplyId}
                                onReplyClick={(replyId) => {
                                    setReplyTargetId(replyId);
                                    setReplyError("");
                                }}
                                onReplySubmit={submitReply}
                                onReplyCancel={() => {
                                    setReplyTargetId(null);
                                    setReplyError("");
                                }}
                                onReplyVote={handleReplyVote}
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
