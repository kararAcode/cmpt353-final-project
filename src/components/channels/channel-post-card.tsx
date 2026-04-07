"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ChannelPostCardProps = {
    post: PostSummary;
    isFocused?: boolean;
    focusReplyId?: string | null;
    onPostReplyCountChange: (postId: string, topLevelReplyCount: number) => void;
    onPostDeleted: (postId: string) => void;
};

export function ChannelPostCard({
    post,
    isFocused = false,
    focusReplyId = null,
    onPostReplyCountChange,
    onPostDeleted,
}: ChannelPostCardProps) {
    const { user, isAuthenticated } = useAuth();
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
    const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);
    const [isDeletingPost, setIsDeletingPost] = useState(false);
    const [isPostDeleteDialogOpen, setIsPostDeleteDialogOpen] = useState(false);
    const [replyToDelete, setReplyToDelete] = useState<PostDetail["replies"][number] | null>(null);

    const isAdmin = user?.role === "admin";

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

    const loadDetail = useCallback(async (force = false) => {
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
    }, [detail, onPostReplyCountChange, post.id]);

    useEffect(() => {
        if (!isFocused) {
            return;
        }

        async function expandFocusedPost() {
            try {
                await loadDetail();
                setIsExpanded(true);
            } catch {}
        }

        void expandFocusedPost();
    }, [isFocused, loadDetail]);

    useEffect(() => {
        if (!isFocused) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            const targetId = focusReplyId ? `reply-${focusReplyId}` : `post-${post.id}`;
            const targetElement =
                document.getElementById(targetId) ?? document.getElementById(`post-${post.id}`);

            targetElement?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);

        return () => window.clearTimeout(timeoutId);
    }, [detail, focusReplyId, isFocused, isExpanded, post.id]);

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

    function removeReplyBranch(
        replies: PostDetail["replies"],
        replyId: string,
    ): PostDetail["replies"] {
        return replies
            .filter((reply) => reply.id !== replyId)
            .map((reply) => ({
                ...reply,
                replies: removeReplyBranch(reply.replies, replyId),
            }));
    }

    function findReplyById(
        replies: PostDetail["replies"],
        replyId: string,
    ): PostDetail["replies"][number] | null {
        for (const reply of replies) {
            if (reply.id === replyId) {
                return reply;
            }

            const nestedMatch = findReplyById(reply.replies, replyId);
            if (nestedMatch) {
                return nestedMatch;
            }
        }

        return null;
    }

    async function handleDeletePost() {
        if (!isAdmin) {
            return;
        }

        try {
            setIsDeletingPost(true);
            setDetailError("");

            const response = await fetch(`/api/posts/${post.id}`, {
                method: "DELETE",
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error?.message || "Failed to delete post.");
            }

            setIsPostDeleteDialogOpen(false);
            onPostDeleted(post.id);
        } catch (error) {
            setDetailError(error instanceof Error ? error.message : "Failed to delete post.");
        } finally {
            setIsDeletingPost(false);
        }
    }

    async function handleDeleteReply(replyId: string) {
        if (!isAdmin) {
            return;
        }

        try {
            setDeletingReplyId(replyId);
            setDetailError("");

            const response = await fetch(`/api/replies/${replyId}`, {
                method: "DELETE",
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result?.error?.message || "Failed to delete reply.");
            }

            setDetail((current) =>
                current
                    ? {
                          ...current,
                          replies: removeReplyBranch(current.replies, replyId),
                      }
                    : current,
            );
            setPostState((current) => ({
                ...current,
                topLevelReplyCount:
                    replyId === post.id
                        ? current.topLevelReplyCount
                        : Math.max(current.topLevelReplyCount - 1, 0),
            }));
            setReplyTargetId((current) => (current === replyId ? null : current));
            setReplyToDelete(null);
            await loadDetail(true);
        } catch (error) {
            setDetailError(error instanceof Error ? error.message : "Failed to delete reply.");
        } finally {
            setDeletingReplyId(null);
        }
    }

    return (
        <Card
            id={`post-${post.id}`}
            className={cn(
                "scroll-mt-24 transition-shadow hover:shadow-md",
                isFocused && "ring-2 ring-accent/50",
            )}
        >
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
                    {isAdmin ? (
                        <Button
                            size="sm"
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeletingPost}
                            onClick={() => {
                                setIsPostDeleteDialogOpen(true);
                                setDetailError("");
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                            {isDeletingPost ? "Deleting..." : "Delete post"}
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
                                isAdmin={isAdmin}
                                replyTargetId={replyTargetId}
                                replyError={replyError}
                                isSubmittingReply={isSubmittingReply}
                                votingReplyId={votingReplyId}
                                deletingReplyId={deletingReplyId}
                                focusedReplyId={focusReplyId}
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
                                onReplyDelete={handleDeleteReply}
                                onReplyDeleteRequest={(replyId) => {
                                    const selectedReply = detail
                                        ? findReplyById(detail.replies, replyId)
                                        : null;
                                    setReplyToDelete(selectedReply);
                                    setDetailError("");
                                }}
                            />
                        ) : (
                            <p className="text-sm text-muted-foreground">No replies yet.</p>
                        )}
                    </div>
                ) : null}
            </CardContent>

            <Dialog open={isPostDeleteDialogOpen} onOpenChange={setIsPostDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm post deletion</DialogTitle>
                        <DialogDescription>
                            Delete the post &quot;{postState.title}&quot; and all replies under it?
                            This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsPostDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isDeletingPost}
                            onClick={() => void handleDeletePost()}
                        >
                            {isDeletingPost ? "Deleting..." : "Confirm delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={Boolean(replyToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setReplyToDelete(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm reply deletion</DialogTitle>
                        <DialogDescription>
                            {replyToDelete
                                ? `Delete this reply from ${replyToDelete.author.displayName} and every nested reply under it? This cannot be undone.`
                                : "Confirm this deletion."}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setReplyToDelete(null)}>
                            Cancel
                        </Button>
                        <Button
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deletingReplyId === replyToDelete?.id}
                            onClick={() => {
                                if (replyToDelete) {
                                    void handleDeleteReply(replyToDelete.id);
                                }
                            }}
                        >
                            {deletingReplyId === replyToDelete?.id
                                ? "Deleting..."
                                : "Confirm delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
