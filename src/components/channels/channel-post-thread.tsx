"use client";

import { FormEvent, useState } from "react";
import { ChevronDown, ChevronUp, MessageCircle, Trash2 } from "lucide-react";

import { AttachmentGallery } from "@/components/channels/attachment-gallery";
import { ScreenshotPicker } from "@/components/channels/screenshot-picker";
import { ReplySummary, formatChannelDate } from "@/components/channels/channel-detail-types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ReplyComposerProps = {
    onSubmit: (body: string, files: File[]) => Promise<boolean>;
    onCancel: () => void;
    isSubmitting: boolean;
    error: string;
};

type ReplyListProps = {
    replies: ReplySummary[];
    isAuthenticated: boolean;
    isAdmin: boolean;
    replyTargetId: string | null;
    replyError: string;
    isSubmittingReply: boolean;
    votingReplyId: string | null;
    deletingReplyId: string | null;
    parentAuthorName?: string;
    focusedReplyId?: string | null;
    onReplyClick: (replyId: string) => void;
    onReplySubmit: (replyId: string, body: string, files: File[]) => Promise<boolean>;
    onReplyCancel: () => void;
    onReplyVote: (replyId: string, nextVote: number) => Promise<void>;
    onReplyDelete: (replyId: string) => Promise<void>;
    onReplyDeleteRequest: (replyId: string) => void;
};

function getInitials(name: string) {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
}

function VoteControls({
    score,
    upvotes,
    downvotes,
    currentUserVote,
    isAuthenticated,
    isSubmitting,
    onVote,
}: {
    score: number;
    upvotes: number;
    downvotes: number;
    currentUserVote: number | null;
    isAuthenticated: boolean;
    isSubmitting: boolean;
    onVote: (value: number) => void;
}) {
    function handleVote(value: number) {
        onVote(currentUserVote === value ? 0 : value);
    }

    return (
        <div className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/40 p-1">
            <button
                type="button"
                className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
                    currentUserVote === 1 && "bg-background text-foreground",
                )}
                disabled={!isAuthenticated || isSubmitting}
                onClick={() => handleVote(1)}
                aria-label="Upvote reply"
            >
                <ChevronUp className="h-4 w-4" />
            </button>
            <span className="min-w-10 text-center text-xs font-semibold text-foreground">
                {score}
            </span>
            <button
                type="button"
                className={cn(
                    "inline-flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground",
                    currentUserVote === -1 && "bg-background text-foreground",
                )}
                disabled={!isAuthenticated || isSubmitting}
                onClick={() => handleVote(-1)}
                aria-label="Downvote reply"
            >
                <ChevronDown className="h-4 w-4" />
            </button>
            <span className="pl-1 text-[11px] text-muted-foreground">
                {upvotes} up • {downvotes} down
            </span>
        </div>
    );
}

function ReplyAvatar({ name }: { name: string }) {
    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground">
            {getInitials(name)}
        </div>
    );
}

function ReplyActions({
    voteSummary,
    currentUserVote,
    attachmentsCount,
    isAuthenticated,
    isAdmin,
    isSubmittingVote,
    isDeleting,
    onReplyClick,
    onVote,
    onDelete,
}: {
    voteSummary: ReplySummary["voteSummary"];
    currentUserVote: number | null;
    attachmentsCount: number;
    isAuthenticated: boolean;
    isAdmin: boolean;
    isSubmittingVote: boolean;
    isDeleting: boolean;
    onReplyClick: () => void;
    onVote: (value: number) => void;
    onDelete: () => void;
}) {
    return (
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <VoteControls
                score={voteSummary.score}
                upvotes={voteSummary.upvotes}
                downvotes={voteSummary.downvotes}
                currentUserVote={currentUserVote}
                isAuthenticated={isAuthenticated}
                isSubmitting={isSubmittingVote}
                onVote={onVote}
            />
            {attachmentsCount > 0 ? <span>{attachmentsCount} attachments</span> : null}
            {isAuthenticated ? (
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 font-medium transition-colors hover:text-foreground"
                    onClick={onReplyClick}
                >
                    <MessageCircle className="h-3.5 w-3.5" />
                    Reply
                </button>
            ) : null}
            {isAdmin ? (
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 font-medium text-destructive transition-colors hover:text-destructive/80"
                    disabled={isDeleting}
                    onClick={onDelete}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                    {isDeleting ? "Deleting..." : "Delete"}
                </button>
            ) : null}
        </div>
    );
}

export function ReplyComposer({
    onSubmit,
    onCancel,
    isSubmitting,
    error,
}: ReplyComposerProps) {
    const [body, setBody] = useState("");
    const [files, setFiles] = useState<File[]>([]);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const trimmedBody = body.trim();
        if (!trimmedBody) {
            return;
        }

        const didSubmit = await onSubmit(trimmedBody, files);

        if (didSubmit) {
            setBody("");
            setFiles([]);
            const form = event.currentTarget;
            form.reset();
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
                value={body}
                onChange={(event) => setBody(event.target.value)}
                placeholder="Write a reply..."
                rows={3}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <ScreenshotPicker files={files} onFilesChange={setFiles} />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={isSubmitting || !body.trim()}>
                    {isSubmitting ? "Replying..." : "Reply"}
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}

export function ReplyList({
    replies,
    isAuthenticated,
    isAdmin,
    replyTargetId,
    replyError,
    isSubmittingReply,
    votingReplyId,
    deletingReplyId,
    parentAuthorName,
    focusedReplyId,
    onReplyClick,
    onReplySubmit,
    onReplyCancel,
    onReplyVote,
    onReplyDelete,
    onReplyDeleteRequest,
}: ReplyListProps) {
    return (
        <div className={cn("divide-y divide-border/70", parentAuthorName && "mt-4")}>
            {replies.map((reply) => (
                <div
                    key={reply.id}
                    id={`reply-${reply.id}`}
                    className={cn(
                        "scroll-mt-24 rounded-lg pt-4 first:pt-0",
                        focusedReplyId === reply.id && "bg-accent/10 px-3 py-3",
                    )}
                >
                    <div className="flex gap-3">
                        <ReplyAvatar name={reply.author.displayName} />
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="text-sm font-semibold text-foreground">
                                    {reply.author.displayName}
                                </span>
                                {parentAuthorName ? (
                                    <span className="text-xs text-muted-foreground">
                                        Replying to {parentAuthorName}
                                    </span>
                                ) : null}
                            </div>
                            <p className="text-sm leading-6 text-foreground">{reply.body}</p>
                            <AttachmentGallery attachments={reply.attachments} />
                            <p className="text-xs text-muted-foreground">
                                {formatChannelDate(reply.createdAt)}
                            </p>
                            <ReplyActions
                                voteSummary={reply.voteSummary}
                                currentUserVote={reply.currentUserVote}
                                attachmentsCount={reply.attachments.length}
                                isAuthenticated={isAuthenticated}
                                isAdmin={isAdmin}
                                isSubmittingVote={votingReplyId === reply.id}
                                isDeleting={deletingReplyId === reply.id}
                                onReplyClick={() => onReplyClick(reply.id)}
                                onVote={(value) => onReplyVote(reply.id, value)}
                                onDelete={() => onReplyDeleteRequest(reply.id)}
                            />
                            {replyTargetId === reply.id ? (
                                <ReplyComposer
                                    error={replyError}
                                    isSubmitting={isSubmittingReply}
                                    onCancel={onReplyCancel}
                                    onSubmit={(body, files) => onReplySubmit(reply.id, body, files)}
                                />
                            ) : null}
                            {reply.replies.length > 0 ? (
                                <div className="pl-3 sm:pl-5">
                                    <ReplyList
                                        replies={reply.replies}
                                        isAuthenticated={isAuthenticated}
                                        isAdmin={isAdmin}
                                        replyTargetId={replyTargetId}
                                        replyError={replyError}
                                        isSubmittingReply={isSubmittingReply}
                                        votingReplyId={votingReplyId}
                                        deletingReplyId={deletingReplyId}
                                        parentAuthorName={reply.author.displayName}
                                        focusedReplyId={focusedReplyId}
                                        onReplyClick={onReplyClick}
                                        onReplySubmit={onReplySubmit}
                                        onReplyCancel={onReplyCancel}
                                        onReplyVote={onReplyVote}
                                        onReplyDelete={onReplyDelete}
                                        onReplyDeleteRequest={onReplyDeleteRequest}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
